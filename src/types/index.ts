export type UserRole = 'owner' | 'editor' | 'viewer';
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'conflict' | 'error';
export type DocStatus = 'active' | 'archived' | 'deleted';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string; // unique collaborator color
  createdAt: Date;
}

export interface Collaborator {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  role: UserRole;
  joinedAt: Date;
  lastSeen?: Date;
}

export interface DocumentVersion {
  _id: string;
  docId: string;
  state: string; // base64 encoded Yjs state
  label: string;
  createdBy: string;
  createdAt: Date;
  size: number;
}

export interface Document {
  _id: string;
  title: string;
  content: string; // latest plain text for preview
  yjsState?: string; // base64 encoded Yjs binary state
  collaborators: Collaborator[];
  status: DocStatus;
  wordCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncOperation {
  id: string;
  docId: string;
  update: string; // base64 encoded Yjs update
  clock: number;
  userId: string;
  createdAt: Date;
  retries: number;
}

export interface SyncPayload {
  docId: string;
  update: string;
  clock: number;
  clientId: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VersionHistoryEntry {
  _id: string;
  label: string;
  createdBy: Collaborator;
  createdAt: Date;
  size: number;
}

export interface CollaboratorPresence {
  userId: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: { from: number; to: number };
  lastSeen: Date;
}
