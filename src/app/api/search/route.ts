import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel } from '@/server/db/models';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  await connectDB();

  // Escape regex special characters before searching
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(safe, 'i');

  const docs = await DocumentModel.find({
    'collaborators.userId': session.user.id,
    status: { $ne: 'deleted' },
    $or: [{ title: regex }, { content: regex }],
  })
    .select('_id title content updatedAt workflowStatus')
    .limit(10)
    .lean();

  const results = docs.map(doc => {
    const plain = (doc.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let snippet = '';
    const idx = plain.toLowerCase().indexOf(q.toLowerCase());
    if (idx !== -1) {
      const s = Math.max(0, idx - 60);
      const e = Math.min(plain.length, idx + q.length + 80);
      snippet = (s > 0 ? '…' : '') + plain.slice(s, e) + (e < plain.length ? '…' : '');
    } else {
      snippet = plain.slice(0, 150);
    }
    return {
      _id:            String(doc._id),
      title:          doc.title || 'Untitled',
      snippet,
      updatedAt:      doc.updatedAt,
      workflowStatus: doc.workflowStatus,
    };
  });

  return NextResponse.json({ results });
}
