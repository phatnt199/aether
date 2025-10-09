import { IRequestedRemark } from '@/common';
import { Request, Response, getModelSchemaRef } from '@loopback/rest';
import get from 'lodash/get';
import multer from 'multer';

// -------------------------------------------------------------------------
export const parseMultipartBody = (opts: {
  storage?: multer.StorageEngine;
  request: Request;
  response: Response;
}) => {
  const { storage: cStorage, request, response } = opts;
  const storage = cStorage ?? multer.memoryStorage();
  const upload = multer({ storage });

  return new Promise<any>((resolve, reject) => {
    upload.any()(request, response, (err: any) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(request.files);
    });
  });
};

// -------------------------------------------------------------------------
export const getSchemaObject = <T extends object>(ctor?: Function & { prototype: T }) => {
  return ctor ? getModelSchemaRef(ctor).definitions[ctor.name] : {};
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
