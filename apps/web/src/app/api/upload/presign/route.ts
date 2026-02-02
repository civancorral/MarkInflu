import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: !!process.env.S3_ENDPOINT,
});

const bucket = process.env.S3_BUCKET || 'markinflu-assets';
const cdnUrl =
  process.env.CDN_URL ||
  (process.env.S3_ENDPOINT
    ? `${process.env.S3_ENDPOINT}/${bucket}`
    : `https://${bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com`);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { fileName, contentType, folder } = await req.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { message: 'fileName y contentType son requeridos' },
        { status: 400 },
      );
    }

    const ext = path.extname(fileName) || '';
    const key = `${folder || 'uploads'}/${session.user.id}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const fileUrl = `${cdnUrl}/${key}`;

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error: any) {
    console.error('Error creating presigned URL:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear URL de subida' },
      { status: 500 },
    );
  }
}
