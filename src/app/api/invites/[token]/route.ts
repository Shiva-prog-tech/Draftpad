import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { InviteTokenModel, DocumentModel, UserModel } from '@/server/db/models';

// GET /api/invites/[token] — return invite info (public, no auth required)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connectDB();

  const invite = await InviteTokenModel.findOne({ token }).lean() as any;
  if (!invite) return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
  if (invite.acceptedAt) return NextResponse.json({ error: 'Invite already accepted' }, { status: 410 });
  if (new Date() > new Date(invite.expiresAt)) return NextResponse.json({ error: 'Invite expired' }, { status: 410 });

  const doc = await DocumentModel.findById(invite.docId).lean() as any;
  if (!doc || doc.status === 'deleted') return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const inviter = await UserModel.findById(invite.invitedBy).lean() as any;

  return NextResponse.json({
    docId:       invite.docId.toString(),
    docTitle:    doc.title || 'Untitled Document',
    inviterName: inviter?.name || 'Someone',
    role:        invite.role,
    email:       invite.email,
    expiresAt:   invite.expiresAt,
  });
}

// POST /api/invites/[token] — accept invite (requires auth)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { token } = await params;
  await connectDB();

  const invite = await InviteTokenModel.findOne({ token });
  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  if (invite.acceptedAt) return NextResponse.json({ error: 'Invite already accepted' }, { status: 410 });
  if (new Date() > invite.expiresAt) return NextResponse.json({ error: 'Invite expired' }, { status: 410 });

  // Verify the logged-in user's email matches the invite email
  const user = await UserModel.findById(userId).lean() as any;
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invite was sent to ${invite.email}. Please log in with that email to accept.` },
      { status: 403 }
    );
  }

  const doc = await DocumentModel.findById(invite.docId);
  if (!doc || doc.status === 'deleted') return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  // Check not already a collaborator
  const already = doc.collaborators.find((c: any) => c.userId.toString() === userId);
  if (already) {
    await InviteTokenModel.findByIdAndUpdate(invite._id, { acceptedAt: new Date() });
    return NextResponse.json({ docId: doc._id.toString(), alreadyMember: true });
  }

  // Add as collaborator
  doc.collaborators.push({
    userId:   user._id,
    name:     user.name,
    email:    user.email,
    avatar:   user.avatar,
    color:    user.color,
    role:     invite.role,
    joinedAt: new Date(),
  });
  await doc.save();

  // Mark invite as accepted
  invite.acceptedAt = new Date();
  await invite.save();

  return NextResponse.json({ docId: doc._id.toString() });
}
