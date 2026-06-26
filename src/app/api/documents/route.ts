import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel, UserModel } from '@/server/db/models';
import { CreateDocumentSchema } from '@/server/validators';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  await connectDB();
  const docs = await DocumentModel.find({
    $or: [
      { createdBy: userId },
      { 'collaborators.userId': userId },
    ],
    status: { $ne: 'deleted' },
  })
    .sort({ updatedAt: -1 })
    .select('title content collaborators status wordCount createdBy createdAt updatedAt')
    .lean();

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const parsed = CreateDocumentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  await connectDB();
  const user = await UserModel.findById(userId).lean() as any;
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const doc = await DocumentModel.create({
    title: parsed.data.title,
    content: '',
    createdBy: userId,
    collaborators: [{
      userId: userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      color: user.color,
      role: 'owner',
    }],
  });

  return NextResponse.json(doc, { status: 201 });
}
