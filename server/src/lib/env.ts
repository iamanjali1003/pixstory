/**
 * env.ts
 * ---------------------------------------------------------------------------
 * Loads the .env file once at startup and exposes a single typed `env`
 * object that the rest of the codebase imports. Centralising env access
 * here means no other file ever touches `process.env` directly, so a missing
 * variable surfaces as a clear startup error instead of an undefined value
 * deep inside a request handler.
 */

import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  port: Number(optional('PORT', '4000')),
  nodeEnv: optional('NODE_ENV', 'development'),

  mongoUri: required('MONGODB_URI'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  awsRegion: required('AWS_REGION'),
  awsAccessKeyId: required('AWS_ACCESS_KEY_ID'),
  awsSecretAccessKey: required('AWS_SECRET_ACCESS_KEY'),
  s3Bucket: required('S3_BUCKET'),
  cloudfrontDomain: required('CLOUDFRONT_DOMAIN'),

  corsOrigins: optional('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
