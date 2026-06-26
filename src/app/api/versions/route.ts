import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel, DocumentVersionModel } from '@/server/db/models';
import { CreateVersionSchema } from '@/server/validators';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const docId = searchParams.get('docId');
  if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });

  await connectDB();
  const doc = await DocumentModel.findOne({ _id: docId, status: { $ne: 'deleted' } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const hasAccess = doc.collaborators.some((c: any) => c.userId.toString() === userId);
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const versions = await DocumentVersionModel.find({ docId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Enrich with user info from collaborators
  const enriched = versions.map((v: any) => {
    const creator = doc.collaborators.find((c: any) => c.userId.toString() === v.createdBy.toString());
    return { ...v, createdByUser: creator || { name: 'Unknown', color: '#6366F1' } };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const parsed = CreateVersionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  await connectDB();
  const doc = await DocumentModel.findOne({ _id: parsed.data.docId, status: { $ne: 'deleted' } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const collab = doc.collaborators.find((c: any) => c.userId.toString() === userId);
  if (!collab || collab.role === 'viewer') return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  const version = await DocumentVersionModel.create({
    docId: parsed.data.docId,
    state: parsed.data.state,
    label: parsed.data.label || `Version ${new Date().toLocaleString()}`,
    createdBy: userId,
    size: parsed.data.state.length,
  });

  return NextResponse.json(version, { status: 201 });
}
