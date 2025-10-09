import { BaseApplication } from '@/base/applications';
import { IController } from '@/common';
import { ApplicationLogger, IUploadFile, LoggerFactory, MinioHelper } from '@/helpers';
import { getError } from '@/utilities';
import { CoreBindings, inject } from '@loopback/core';
import {
  api,
  del,
  get,
  param,
  post,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import multer from 'multer';
import { ResourceAssetKeys } from '../common';

@api({ basePath: '/static-assets' })
export class StaticAssetController implements IController {
  protected logger: ApplicationLogger;
  private temporaryStorage: multer.StorageEngine;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
    // @inject(RestBindings.Http.REQUEST) private request: Request,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
  ) {
    this.logger = LoggerFactory.getLogger([StaticAssetController.name]);
    this.temporaryStorage = multer.memoryStorage();
  }

  @post('/buckets/{bucket_name}', {
    responses: {
      '200': {
        description: 'Create minio bucket with name',
        content: { 'application/json': {} },
      },
    },
  })
  createBucket(@param.path.string('bucket_name') bucketName: string) {
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);
    return minioInstance.createBucket({ name: bucketName });
  }

  @del('/buckets/{bucket_name}', {
    responses: {
      '200': {
        description: 'Delete minio bucket by name',
        content: { 'application/json': {} },
      },
    },
  })
  removeBucket(@param.path.string('bucket_name') bucketName: string) {
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);
    return minioInstance.removeBucket({ name: bucketName });
  }

  @get('/buckets/{bucket_name}', {
    responses: {
      '200': {
        description: 'Get minio bucket by name',
        content: { 'application/json': {} },
      },
    },
  })
  getBucket(@param.path.string('bucket_name') bucketName: string) {
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);
    return minioInstance.getBucket({ name: bucketName });
  }

  @get('/buckets', {
    responses: {
      '200': {
        description: 'Get minio bucket by name',
        content: { 'application/json': {} },
      },
    },
  })
  getBuckets() {
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);
    return minioInstance.getBuckets();
  }

  @post('/buckets/{bucket_name}/upload', {
    responses: {
      '200': {
        description: 'Upload files to bucket',
        content: { 'application/json': {} },
      },
    },
  })
  uploadObject(
    @requestBody({
      description: 'Upload files to minio',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              files: {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
      },
    })
    request: Request,
    @param.path.string('bucket_name') bucketName: string,
    @param.query.string('folder_path') folderPath?: string,
  ) {
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);
    return new Promise((resolve, reject) => {
      const extractor = multer({ storage: this.temporaryStorage }).array('files');
      extractor(request, this.response, error => {
        if (error) {
          this.logger.error('[uploadObject] Fail to upload files! Error: %s', error);
          reject(error);
        }

        if (folderPath) {
          // Removes leading and trailing slashes
          folderPath = folderPath.replace(/^\/|\/$/g, '');
        }

        const files: Express.Multer.File[] = (request as any).files;
        const modifiedFiles: IUploadFile[] = files.map(file => ({
          ...file,
          originalname: folderPath ? `${folderPath}/${file.originalname}` : file.originalname,
        }));

        minioInstance
          .upload({ bucket: bucketName, files: modifiedFiles })
          .then(rs => {
            resolve(rs);
          })
          .catch(reject);
      });
    });
  }

  @get('/{bucket_name}/{object_name}/download')
  downloadObject(
    @param.path.string('bucket_name') bucketName: string,
    @param.path.string('object_name') objectName: string,
  ) {
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);
    return new Promise(() => {
      minioInstance.getStat({ bucket: bucketName, name: objectName }).then(fileStat => {
        const { size, metaData } = fileStat;
        this.response.set({
          ...metaData,
          'Content-Length': size,
          'Content-Disposition': `attachment; filename=${objectName}`,
        });

        minioInstance
          .getFile({
            bucket: bucketName,
            name: objectName,
          })
          .then(stream => {
            stream.pipe(this.response);
            stream.on('end', () => {
              this.response.end();
            });
          })
          .catch(error => {
            this.logger.error('[downloadObject] Error: %s', error);
            throw getError({
              message: `[downloadObject] Cannot download ${objectName}! Error while streaming data to client!`,
              statusCode: 500,
            });
          });
      });
    });
  }

  @get('/{bucket_name}/{object_name}')
  getStaticObject(
    @param.path.string('bucket_name') bucketName: string,
    @param.path.string('object_name') objectName: string,
  ) {
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);
    return new Promise(() => {
      minioInstance.getStat({ bucket: bucketName, name: objectName }).then(fileStat => {
        const { size, metaData } = fileStat;
        this.response.writeHead(206, {
          ...metaData,
          'Content-Type': 'application/octet-stream',
          'Content-Length': size,
        });

        minioInstance
          .getFile({
            bucket: bucketName,
            name: objectName,
          })
          .then(stream => {
            stream.pipe(this.response);
          })
          .catch(error => {
            this.logger.error('[getStaticObject] Error: %s', error);
            throw getError({
              message: `[getStaticObject] Cannot stream ${objectName}! Error while streaming data to client!`,
              statusCode: 500,
            });
          });
      });
    });
  }

  /**
   * This method fetches the whole file from minio and streams it to the client.
   * It's meant to be used for using file caching on browser.
   * For other use cases, use `getStaticObject` instead.
   *
   * NOTE: By the time this method was written, Google Chrome cannot cache content
   * if the response status code is 206 (Partial Content). So, we use 200 instead.
   */
  @get('/{bucket_name}/{object_name}/file')
  async fetchWholeFile(
    @param.path.string('bucket_name') bucketName: string,
    @param.path.string('object_name') objectName: string,
    @param.query.number('cache_time', { required: false }) cacheTime?: number,
  ) {
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);

    try {
      const fileStat = await minioInstance.getStat({
        bucket: bucketName,
        name: objectName,
      });
      const { size, metaData, lastModified } = fileStat;

      const fileStream = await minioInstance.getFile({
        bucket: bucketName,
        name: objectName,
      });

      const buffers: Buffer[] = [];

      for await (const buffer of fileStream) {
        buffers.push(buffer);
      }

      const file = Buffer.concat(buffers);

      this.response.writeHead(200, {
        ...metaData,
        'Content-Length': size,
        'Content-Type': metaData['content-type'] ?? metaData['mimetype'],
        'Cache-Control': `private, max-age=${cacheTime ?? 60 * 60}`,
        'Last-Modified': lastModified.toUTCString(),
      });

      this.response.end(file);
    } catch (error) {
      this.logger.error('[getWholeFile] Error %o', error);

      throw getError({
        statusCode: 500,
        message: 'Error while fetching file',
      });
    }
  }

  @del('/{bucket_name}/', {
    description: 'Delete multiple objects from bucket',
    responses: {
      '200': {
        description: 'Delete object',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async deleteObjects(
    @param.path.string('bucket_name', { required: true }) bucketName: string,
    @requestBody({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              objectNames: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    })
    payload: {
      objectNames: string[];
    },
    @param.query.string('folder_path', { required: false }) folderPath?: string,
  ) {
    const { objectNames } = payload;
    const minioInstance = this.application.getSync<MinioHelper>(ResourceAssetKeys.MINIO_INSTANCE);

    let deletingObjects: string[] = objectNames;
    if (folderPath) {
      folderPath = folderPath.replace(/^\/|\/$/g, '');

      deletingObjects = objectNames.map(objectName => `${folderPath}/${objectName}`);
    }

    try {
      await minioInstance.client.removeObjects(bucketName, deletingObjects);

      this.response.status(200).send({
        message: 'Object deleted successfully',
      });
    } catch (error) {
      this.logger.error('[deleteObject] Error %o', error);
      throw getError({
        statusCode: 500,
        message: 'Error while deleting object',
      });
    }
  }
}
