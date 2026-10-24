/**
 * memories.ts (route)
 * ---------------------------------------------------------------------------
 * All memory endpoints:
 *
 *   GET   /                  list memories (newest first), optional ?q= search
 *   POST  /upload-url        get a presigned S3 PUT URL (auth required)
 *   POST  /                  save a memory's metadata after S3 upload succeeds
 *   POST  /:id/like          toggle a like
 *   POST  /:id/comments      add a comment
 *
 * The browser uploads the image bytes directly to S3 using the presigned URL,
 * then calls POST / to persist caption/location/activity along with the s3Key
 * that came back from /upload-url. POST / enforces that the supplied s3Key
 * lives under the caller's own per-user prefix (`memories/<userId>/`) so
 * one user cannot register another user's object as their own memory.
 *
 * Liking is a single atomic update ($addToSet to like, $pull to unlike)
 * rather than read, edit, save: two people liking the same memory at once
 * would otherwise overwrite each other's change.
 */

import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Memory } from '../models/Memory';
import { User } from '../models/User';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { createUploadUrl, imageUrlFor } from '../lib/s3';

const router = Router();

const uploadUrlSchema = z.object({
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
  fileExtension: z.string().min(1).max(6),
});

const createMemorySchema = z.object({
  s3Key: z.string().min(1),
  caption: z.string().max(280).optional().default(''),
  location: z.string().max(120).optional().default(''),
  activity: z.string().max(80).optional().default(''),
});

const commentSchema = z.object({
  text: z.string().min(1).max(500),
});

function serializeMemory(doc: any, currentUserId?: string) {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    userName: doc.userName,
    imageUrl: imageUrlFor(doc.s3Key),
    caption: doc.caption,
    location: doc.location,
    activity: doc.activity,
    likeCount: doc.likes.length,
    likedByMe: currentUserId
      ? doc.likes.some((id: Types.ObjectId) => String(id) === currentUserId)
      : false,
    comments: doc.comments.map((c: any) => ({
      id: String(c._id),
      userId: String(c.userId),
      userName: c.userName,
      text: c.text,
      createdAt: c.createdAt,
    })),
    createdAt: doc.createdAt,
  };
}

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const filter = q ? { $text: { $search: q } } : {};
  const docs = await Memory.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ memories: docs.map((d) => serializeMemory(d, req.user?.userId)) });
});

router.post('/upload-url', requireAuth, async (req: Request, res: Response) => {
  const body = uploadUrlSchema.parse(req.body);
  const ticket = await createUploadUrl({
    userId: req.user!.userId,
    contentType: body.contentType,
    fileExtension: body.fileExtension,
  });
  res.json(ticket);
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const body = createMemorySchema.parse(req.body);

  const expectedPrefix = `memories/${req.user!.userId}/`;
  if (!body.s3Key.startsWith(expectedPrefix) || body.s3Key.includes('..')) {
    res.status(400).json({ error: 'Invalid s3Key' });
    return;
  }

  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(401).json({ error: 'User no longer exists' });
    return;
  }
  const doc = await Memory.create({
    userId: user._id,
    userName: user.name,
    s3Key: body.s3Key,
    caption: body.caption,
    location: body.location,
    activity: body.activity,
  });
  res.status(201).json({ memory: serializeMemory(doc.toObject(), req.user!.userId) });
});

router.post('/:id/like', requireAuth, async (req: Request, res: Response) => {
  const memoryId = String(req.params.id);
  if (!Types.ObjectId.isValid(memoryId)) {
    res.status(400).json({ error: 'Invalid memory id' });
    return;
  }
  const userObjectId = new Types.ObjectId(req.user!.userId);
  const alreadyLiked = await Memory.exists({ _id: memoryId, likes: userObjectId });
  const memory = await Memory.findByIdAndUpdate(
    memoryId,
    alreadyLiked ? { $pull: { likes: userObjectId } } : { $addToSet: { likes: userObjectId } },
    { new: true }
  ).lean();
  if (!memory) {
    res.status(404).json({ error: 'Memory not found' });
    return;
  }
  res.json({ memory: serializeMemory(memory, req.user!.userId) });
});

router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  const memoryId = String(req.params.id);
  if (!Types.ObjectId.isValid(memoryId)) {
    res.status(400).json({ error: 'Invalid memory id' });
    return;
  }
  const body = commentSchema.parse(req.body);
  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(401).json({ error: 'User no longer exists' });
    return;
  }
  const memory = await Memory.findById(memoryId);
  if (!memory) {
    res.status(404).json({ error: 'Memory not found' });
    return;
  }
  memory.comments.push({
    userId: user._id as unknown as Types.ObjectId,
    userName: user.name,
    text: body.text,
    createdAt: new Date(),
  } as any);
  await memory.save();
  res.status(201).json({ memory: serializeMemory(memory.toObject(), req.user!.userId) });
});

export default router;
