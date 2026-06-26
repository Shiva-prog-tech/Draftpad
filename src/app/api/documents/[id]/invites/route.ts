import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel, InviteTokenModel } from '@/server/db/models';

// GET /api/documents/[id]/invites — list active pending invites (owner only)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;
    const { id } = await params;

    await connectDB();
    const doc = await DocumentModel.findOne({ _id: id, status: { $ne: 'deleted' } }).lean() as any;
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = doc.collaborators.find(
      (c: any) => c.userId.toString() === userId && c.role === 'owner',
    );
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const invites = await InviteTokenModel.find({
      docId: id,
      acceptedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .select('token email role createdAt expiresAt')
      .lean();

    return NextResponse.json({ invites });
  } catch (err) {
    console.error('[GET /invites]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/invites?token=xxx — cancel a pending invite (owner only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;
    const { id } = await params;

    const token = new URL(req.url).searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    await connectDB();
    const doc = await DocumentModel.findOne({ _id: id, status: { $ne: 'deleted' } }).lean() as any;
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = doc.collaborators.find(
      (c: any) => c.userId.toString() === userId && c.role === 'owner',
    );
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const deleted = await InviteTokenModel.findOneAndDelete({ token, docId: id, acceptedAt: null });
    if (!deleted) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /invites]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
