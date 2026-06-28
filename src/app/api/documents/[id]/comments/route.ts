import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { CommentModel, DocumentModel, UserModel } from '@/server/db/models';
import { CreateCommentSchema, ReplyCommentSchema, ResolveCommentSchema } from '@/server/validators';

type Params = { params: Promise<{ id: string }> };

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as typeof session & { user: { id: string } };
}

// GET — list all comments for a document
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const doc = await DocumentModel.findOne({ _id: id, status: { $ne: 'deleted' } }).lean() as any;
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const hasAccess = doc.collaborators.some((c: any) => c.userId.toString() === session.user.id);
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const comments = await CommentModel.find({ docId: id }).sort({ createdAt: 1 }).lean();
  return NextResponse.json(comments);
}

// POST — create a new comment
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  await connectDB();

  const doc = await DocumentModel.findOne({ _id: id, status: { $ne: 'deleted' } }).lean() as any;
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const hasAccess = doc.collaborators.some((c: any) => c.userId.toString() === session.user.id);
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const user = await UserModel.findById(session.user.id).lean() as any;
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const comment = await CommentModel.create({
    docId:     id,
    userId:    session.user.id,
    userName:  user.name,
    userColor: user.color,
    text:      parsed.data.text,
    quote:     parsed.data.quote,
  });

  return NextResponse.json(comment, { status: 201 });
}

// PATCH — add a reply to an existing comment
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = ReplyCommentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  await connectDB();

  const user = await UserModel.findById(session.user.id).lean() as any;
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const c = await CommentModel.findOne({ _id: parsed.data.commentId, docId: id });
  if (!c) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

  c.replies.push({
    userId:    session.user.id as any,
    userName:  user.name,
    userColor: user.color,
    text:      parsed.data.text,
  } as any);

  await c.save();
  return NextResponse.json(c);
}

// PUT — resolve a comment
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = ResolveCommentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  await connectDB();

  const updated = await CommentModel.findOneAndUpdate(
    { _id: parsed.data.commentId, docId: id },
    { resolved: true, resolvedAt: new Date() },
    { new: true }
  );

  if (!updated) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  return NextResponse.json(updated);
}
