/**
 * auth.ts (route)
 * ---------------------------------------------------------------------------
 * Exposes /signup and /login. Both return the same shape:
 *   { token, user: { id, email, name } }
 * The client stores the token and sends it as `Authorization: Bearer <token>`
 * on every subsequent request.
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { signAuthToken } from '../lib/jwt';

const router = Router();

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(60),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

router.post('/signup', async (req: Request, res: Response) => {
  const body = signupSchema.parse(req.body);
  const existing = await User.findOne({ email: body.email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }
  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await User.create({
    email: body.email.toLowerCase(),
    passwordHash,
    name: body.name,
  });
  const token = signAuthToken({ userId: String(user._id), email: user.email });
  res.status(201).json({
    token,
    user: { id: String(user._id), email: user.email, name: user.name },
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ email: body.email.toLowerCase() });
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = signAuthToken({ userId: String(user._id), email: user.email });
  res.json({
    token,
    user: { id: String(user._id), email: user.email, name: user.name },
  });
});

export default router;
