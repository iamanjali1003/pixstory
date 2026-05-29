/**
 * s3.ts
 * ---------------------------------------------------------------------------
 * Thin wrapper around AWS S3. Exposes two helpers:
 *
 *   - `createUploadUrl`: generates a short-lived presigned PUT URL the
 *     browser uses to upload a file directly to S3 (so the Express server
 *     never proxies image bytes). The bucket stays private — only a signed
 *     request can write to it.
 *
 *   - `imageUrlFor`: turns an S3 object key into the public CloudFront URL
 *     the browser uses to load the image. The bucket itself is private;
 *     CloudFront (via Origin Access Control) is the only reader, so images
 *     are served fast from the CDN without ever exposing the bucket.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { env } from './env';

const s3 = new S3Client({
  region: env.awsRegion,
  credentials: {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
  },
});

export interface UploadTicket {
  uploadUrl: string;
  s3Key: string;
}

export async function createUploadUrl(params: {
  userId: string;
  contentType: string;
  fileExtension: string;
}): Promise<UploadTicket> {
  const safeExt = params.fileExtension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
  const s3Key = `memories/${params.userId}/${uuid()}.${safeExt}`;

  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: s3Key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return { uploadUrl, s3Key };
}

export function imageUrlFor(s3Key: string): string {
  return `https://${env.cloudfrontDomain}/${s3Key}`;
}
