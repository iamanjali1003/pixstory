/**
 * User.ts
 * ---------------------------------------------------------------------------
 * Mongoose model for an account. Stores the bcrypt hash of the password,
 * never the plaintext. Email is unique and lowercased on save so logins
 * are case-insensitive.
 */

import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: string };

export const User: Model<UserDoc> = model<UserDoc>('User', userSchema);
