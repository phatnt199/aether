import { IRequestedRemark } from '@/common';
import { Context } from 'hono';
import get from 'lodash/get';
import fs from 'node:fs';
import path from 'node:path';

// -------------------------------------------------------------------------
interface ParseMultipartOptions {
  storage?: 'memory' | 'disk';
  uploadDir?: string;
  context: Context;
}

interface ParsedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  filename?: string;
  path?: string;
}

export const parseMultipartBody = async (opts: ParseMultipartOptions): Promise<ParsedFile[]> => {
  const { storage = 'memory', uploadDir = './uploads', context } = opts;

  const formData = await context.req.formData();
  const files: ParsedFile[] = [];

  if (storage === 'disk' && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  for (const [fieldname, value] of formData.entries()) {
    if (!(value instanceof File)) {
      continue;
    }

    const file = value;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedFile: ParsedFile = {
      fieldname,
      originalname: file.name,
      encoding: '7bit', // Default encoding
      mimetype: file.type,
      size: file.size,
    };

    if (storage === 'memory') {
      // Store in memory (like multer.memoryStorage())
      parsedFile.buffer = buffer;
    } else if (storage === 'disk') {
      // Store on disk (like multer.diskStorage())
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const filename = `${timestamp}-${randomString}-${file.name}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, buffer);

      parsedFile.filename = filename;
      parsedFile.path = filepath;
    }

    files.push(parsedFile);
  }

  return files;
};

// -------------------------------------------------------------------------
export const getRequestId = (opts: { request: Request }) => {
  return get(opts.request, 'requestId');
};

// -------------------------------------------------------------------------
export const getRequestIp = (opts: { request: Request }) => {
  return get(opts.request, 'requestForwardedIp') ?? 'N/A';
};

// -------------------------------------------------------------------------
export const getRequestRemark = (opts: { request: Request }): IRequestedRemark | undefined => {
  return get(opts.request, 'requestedRemark');
};
