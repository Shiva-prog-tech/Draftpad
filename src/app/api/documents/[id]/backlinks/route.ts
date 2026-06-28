import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel } from '@/server/db/models';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  // Find accessible documents whose content contains a link to this doc's ID
  const pattern = new RegExp(`/docs/${id}`, 'i');
  const docs = await DocumentModel.find({
    'collaborators.userId': session.user.id,
    status:  { $ne: 'deleted' },
    _id:     { $ne: id },
    content: pattern,
  })
    .select('_id title updatedAt')
    .limit(30)
    .lean();

  return NextResponse.json({
    backlinks: docs.map(d => ({
      _id:       String(d._id),
      title:     d.title || 'Untitled',
      updatedAt: d.updatedAt,
    })),
  });
}
