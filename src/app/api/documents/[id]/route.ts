import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel } from '@/server/db/models';
import { UpdateDocumentSchema } from '@/server/validators';

async function getDocWithAccess(docId: string, userId: string, minRole?: string) {
  await connectDB();
  const doc = await DocumentModel.findOne({ _id: docId, status: { $ne: 'deleted' } });
  if (!doc) return { doc: null, error: 'Not found', status: 404 };
  const collab = doc.collaborators.find((c: any) => c.userId.toString() === userId);
  if (!collab) return { doc: null, error: 'Forbidden', status: 403 };
  if (minRole === 'editor' && collab.role === 'viewer') return { doc: null, error: 'Viewer cannot edit', status: 403 };
  if (minRole === 'owner' && collab.role !== 'owner') return { doc: null, error: 'Owner only', status: 403 };
  return { doc, collab, error: null, status: 200 };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;
  const { doc, error, status } = await getDocWithAccess(id, userId);
  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;
  const { doc, error, status } = await getDocWithAccess(id, userId, 'editor');
  if (error) return NextResponse.json({ error }, { status });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateDocumentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  Object.assign(doc, parsed.data);
  await doc.save();
  return NextResponse.json(doc);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;
  const { doc, error, status } = await getDocWithAccess(id, userId, 'owner');
  if (error) return NextResponse.json({ error }, { status });

  doc.status = 'deleted';
  await doc.save();
  return NextResponse.json({ success: true });
}
