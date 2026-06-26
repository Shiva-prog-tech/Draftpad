import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel, InviteTokenModel } from '@/server/db/models';
import { InviteCollaboratorSchema, UpdateRoleSchema } from '@/server/validators';
import { sendInviteEmail } from '@/server/email';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  await connectDB();
  const doc = await DocumentModel.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ownerCollab = doc.collaborators.find((c: any) => c.userId.toString() === userId);
  if (!ownerCollab || ownerCollab.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can invite' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = InviteCollaboratorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const inviteEmail = parsed.data.email.toLowerCase();

  // Check if already a collaborator
  const already = doc.collaborators.find((c: any) => c.email === inviteEmail);
  if (already) return NextResponse.json({ error: 'Already a collaborator' }, { status: 409 });

  // Check if a pending invite already exists for this email+doc
  const pending = await InviteTokenModel.findOne({
    docId: id,
    email: inviteEmail,
    acceptedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (pending) return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 409 });

  // Create invite token (expires in 48 hours)
  const token = nanoid(32);
  await InviteTokenModel.create({
    token,
    docId: id,
    email: inviteEmail,
    role: parsed.data.role,
    invitedBy: userId,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });

  // Send invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  await sendInviteEmail({
    to: inviteEmail,
    inviterName: ownerCollab.name,
    docTitle: doc.title || 'Untitled Document',
    role: parsed.data.role,
    acceptUrl: `${appUrl}/invite/${token}`,
  });

  return NextResponse.json({ success: true, message: 'Invite sent successfully' });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  await connectDB();
  const doc = await DocumentModel.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ownerCollab = doc.collaborators.find((c: any) => c.userId.toString() === userId);
  if (!ownerCollab || ownerCollab.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can change roles' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const collab = doc.collaborators.find((c: any) => c.userId.toString() === parsed.data.userId);
  if (!collab) return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
  if (collab.role === 'owner') return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });

  collab.role = parsed.data.role;
  await doc.save();
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const requesterId = session.user.id;
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await connectDB();
  const doc = await DocumentModel.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ownerCollab = doc.collaborators.find((c: any) => c.userId.toString() === requesterId);
  if (!ownerCollab || ownerCollab.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can remove collaborators' }, { status: 403 });
  }

  doc.collaborators = doc.collaborators.filter((c: any) => c.userId.toString() !== userId);
  await doc.save();
  return NextResponse.json({ success: true });
}
