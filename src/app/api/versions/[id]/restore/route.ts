import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel, DocumentVersionModel } from '@/server/db/models';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  await connectDB();

  const version = await DocumentVersionModel.findById(id);
  if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

  const doc = await DocumentModel.findOne({ _id: version.docId, status: { $ne: 'deleted' } });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const collab = doc.collaborators.find((c: any) => c.userId.toString() === userId);
  if (!collab || collab.role === 'viewer') return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  // Save current state as a new version before restoring
  await DocumentVersionModel.create({
    docId: doc._id,
    state: doc.yjsState || '',
    label: `Before restore — ${new Date().toLocaleString()}`,
    createdBy: userId,
    size: (doc.yjsState || '').length,
  });

  // Restore to selected version
  doc.yjsState = version.state;
  await doc.save();

  return NextResponse.json({ success: true, restoredState: version.state });
}
