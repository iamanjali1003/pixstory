/**
 * Memory.ts
 * ---------------------------------------------------------------------------
 * Mongoose model for one shared photo in the gallery. The `s3Key` points
 * to the object the browser uploaded directly to S3 (via a presigned URL).
 * Likes are a set of user IDs so toggling stays idempotent. Comments are
 * embedded because they're always loaded with the parent memory.
 *
 * A text index across caption / location / activity powers the search box.
 */

import { Schema, model, Types, type InferSchemaType, type Model } from 'mongoose';

const commentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500, trim: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const memorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    s3Key: { type: String, required: true },
    caption: { type: String, default: '', trim: true, maxlength: 280 },
    location: { type: String, default: '', trim: true, maxlength: 120 },
    activity: { type: String, default: '', trim: true, maxlength: 80 },
    likes: { type: [Schema.Types.ObjectId], default: [], ref: 'User' },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

memorySchema.index({ caption: 'text', location: 'text', activity: 'text' });
memorySchema.index({ createdAt: -1 });

export type MemoryDoc = InferSchemaType<typeof memorySchema> & { _id: Types.ObjectId };

export const Memory: Model<MemoryDoc> = model<MemoryDoc>('Memory', memorySchema);
