import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel } from '@/server/db/models';
import { SyncPayloadSchema } from '@/server/validators';
import { mergeStates, createYDoc, applyStateFromBase64, getTextFromDoc, stripHtml, countWords } from '@/lib/crdt/yjs-utils';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  // Size guard — prevent OOM attacks
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 600_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SyncPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 });
  }

  const { docId, update, clock } = parsed.data;

  await connectDB();
  const doc = await DocumentModel.findOne({ _id: docId, status: { $ne: 'deleted' } });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  // Authorization: viewers cannot push updates
  const collab = doc.collaborators.find((c: any) => c.userId.toString() === userId);
  if (!collab) return NextResponse.json({ error: 'Not a collaborator' }, { status: 403 });
  if (collab.role === 'viewer') return NextResponse.json({ error: 'Viewers cannot sync changes' }, { status: 403 });

  // Merge incoming update with server state using Yjs CRDT
  let mergedState: string;
  if (doc.yjsState) {
    mergedState = mergeStates([doc.yjsState, update]);
  } else {
    mergedState = update;
  }

  // Extract plain text for preview/search
  const ydoc = createYDoc();
  applyStateFromBase64(ydoc, mergedState);
  const plainText = stripHtml(getTextFromDoc(ydoc));

  doc.yjsState = mergedState;
  doc.content = plainText.slice(0, 500);
  doc.wordCount = countWords(plainText);
  doc.updatedAt = new Date();
  await doc.save();

  return NextResponse.json({
    success: true,
    serverState: mergedState,
    clock,
  });
}
