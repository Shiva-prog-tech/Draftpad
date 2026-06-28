import { z } from 'zod';

export const SyncPayloadSchema = z.object({
  docId: z.string().min(1).max(100),
  update: z.string().max(512_000), // 500KB hard limit — prevents OOM
  clock: z.number().int().nonnegative(),
  clientId: z.string().max(100),
});

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(500).default('Untitled Document'),
});

export const UpdateDocumentSchema = z.object({
  title:          z.string().min(1).max(500).optional(),
  content:        z.string().max(2_000_000).optional(),
  yjsState:       z.string().max(1_024_000).optional(),
  wordCount:      z.number().int().nonnegative().optional(),
  workflowStatus: z.enum(['draft', 'review', 'approved']).optional(),
});

export const InviteCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']),
});

export const UpdateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['editor', 'viewer']),
});

export const CreateVersionSchema = z.object({
  docId: z.string().min(1),
  state: z.string().max(1_024_000),
  label: z.string().max(200).optional(),
});

export const AIRequestSchema = z.object({
  prompt: z.string().min(1).max(10_000),
  context: z.string().max(50_000).optional(),
  action: z.enum(['improve', 'summarize', 'grammar', 'shorten', 'custom', 'formal', 'continue', 'review', 'template']),
});

export const CreateCommentSchema = z.object({
  text: z.string().min(1).max(5_000),
  quote: z.string().max(2_000).default(''),
});

export const ReplyCommentSchema = z.object({
  commentId: z.string().min(1),
  text: z.string().min(1).max(5_000),
});

export const ResolveCommentSchema = z.object({
  commentId: z.string().min(1),
});

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
