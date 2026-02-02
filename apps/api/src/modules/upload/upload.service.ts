import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

interface PresignedUploadOptions {
  fileName: string;
  contentType: string;
  folder: string;
  maxSize?: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';

    this.s3 = new S3Client({
      region,
      ...(endpoint && { endpoint }),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY') || '',
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY') || '',
      },
      forcePathStyle: !!endpoint, // Required for R2/MinIO
    });

    this.bucket = this.configService.get<string>('S3_BUCKET') || 'markinflu-assets';

    // Public URL: CDN or direct S3
    this.publicUrl =
      this.configService.get<string>('CDN_URL') ||
      (endpoint
        ? `${endpoint}/${this.bucket}`
        : `https://${this.bucket}.s3.${region}.amazonaws.com`);
  }

  // ============================================
  // PRESIGNED URL — For client-side uploads
  // ============================================

  async getPresignedUploadUrl(
    userId: string,
    options: PresignedUploadOptions,
  ): Promise<PresignedUploadResult> {
    const { fileName, contentType, folder, maxSize = MAX_FILE_SIZE } = options;

    this.validateContentType(contentType);

    const ext = path.extname(fileName) || this.getExtFromMime(contentType);
    const key = `${folder}/${userId}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 3600, // 1 hour
    });

    const fileUrl = `${this.publicUrl}/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  // ============================================
  // PRESIGNED URL — For private downloads
  // ============================================

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  // ============================================
  // DELETE — Remove file from storage
  // ============================================

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  // ============================================
  // HELPERS
  // ============================================

  private validateContentType(contentType: string) {
    const allAllowed = [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_VIDEO_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
    ];

    if (!allAllowed.includes(contentType)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${contentType}`,
      );
    }
  }

  private getExtFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
      'application/pdf': '.pdf',
    };
    return map[mime] || '';
  }

  getFileCategory(contentType: string): 'image' | 'video' | 'document' {
    if (ALLOWED_IMAGE_TYPES.includes(contentType)) return 'image';
    if (ALLOWED_VIDEO_TYPES.includes(contentType)) return 'video';
    return 'document';
  }
}
