import { redirect, notFound } from 'next/navigation';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DocumentModel } from '@/server/db/models';
import { Editor } from '@/components/editor/Editor';

export default async function DocPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const { id } = await params;
  const { template } = await searchParams;
  await connectDB();

  const doc = await DocumentModel.findOne({ _id: id, status: { $ne: 'deleted' } }).lean() as any;
  if (!doc) notFound();

  const hasAccess = doc.collaborators.some((c: any) => c.userId.toString() === userId);
  if (!hasAccess) redirect('/dashboard');

  // Serialize for client
  const serialized = JSON.parse(JSON.stringify(doc));

  return <Editor doc={serialized} templateId={template} />;
}
