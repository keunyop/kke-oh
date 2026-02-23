import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getEnv } from '@/lib/config';

const client = new S3Client({
  endpoint: getEnv('R2_ENDPOINT'),
  region: 'auto',
  credentials: {
    accessKeyId: getEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY')
  }
});

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: getEnv('R2_BUCKET'),
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );
  return `${getEnv('R2_ENDPOINT').replace(/\/$/, '')}/${getEnv('R2_BUCKET')}/${key}`;
}

export function getPublicR2BaseUrl(): string {
  return `${getEnv('R2_ENDPOINT').replace(/\/$/, '')}/${getEnv('R2_BUCKET')}`;
}
