import mongoose, { Schema, model, models } from 'mongoose';

// User Model
const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  avatar: { type: String },
  color: { type: String, default: () => {
    const colors = ['#6366F1','#EC4899','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EF4444','#14B8A6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }},
}, { timestamps: true });

// Document Version Model
const DocumentVersionSchema = new Schema({
  docId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  state: { type: String, required: true }, // base64 Yjs state
  label: { type: String, default: 'Auto-save' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  size: { type: Number, default: 0 },
}, { timestamps: true });

// Document Model
const CollaboratorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: { type: String },
  color: { type: String, required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
  joinedAt: { type: Date, default: Date.now },
  lastSeen: { type: Date },
}, { _id: false });

const DocumentSchema = new Schema({
  title: { type: String, default: 'Untitled Document', trim: true },
  content: { type: String, default: '' }, // plain text preview
  yjsState: { type: String }, // base64 Yjs binary state
  collaborators: [CollaboratorSchema],
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
  workflowStatus: { type: String, enum: ['draft', 'review', 'approved'], default: 'draft' },
  wordCount: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Index for efficient queries
DocumentSchema.index({ createdBy: 1, status: 1 });
DocumentSchema.index({ 'collaborators.userId': 1, status: 1 });

// Invite Token Model
const InviteTokenSchema = new Schema({
  token:      { type: String, required: true, unique: true, index: true },
  docId:      { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  email:      { type: String, required: true, lowercase: true },
  role:       { type: String, enum: ['editor', 'viewer'], default: 'editor' },
  invitedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt:  { type: Date, required: true },
  acceptedAt: { type: Date },
}, { timestamps: true });

// Comment Model
const ReplySchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, required: true },
  userColor: { type: String, required: true },
  text:      { type: String, required: true },
}, { timestamps: true });

const CommentSchema = new Schema({
  docId:      { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:   { type: String, required: true },
  userColor:  { type: String, required: true },
  text:       { type: String, required: true },
  quote:      { type: String, default: '' },
  resolved:   { type: Boolean, default: false },
  resolvedAt: { type: Date },
  replies:    [ReplySchema],
}, { timestamps: true });

export const UserModel            = models.User            || model('User',            UserSchema);
export const DocumentModel        = models.Document        || model('Document',        DocumentSchema);
export const DocumentVersionModel = models.DocumentVersion || model('DocumentVersion', DocumentVersionSchema);
export const InviteTokenModel     = models.InviteToken     || model('InviteToken',     InviteTokenSchema);
export const CommentModel         = models.Comment         || model('Comment',         CommentSchema);
