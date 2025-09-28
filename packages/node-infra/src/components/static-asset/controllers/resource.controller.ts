import { BaseApplication } from '@/base/applications';
import { Formatters, IController } from '@/common';
import { ApplicationLogger, IUploadFile, LoggerFactory } from '@/helpers';
import { dayjs, getError } from '@/utilities';
import { CoreBindings, inject } from '@loopback/core';
import { api, get, param, post, Request, Response, RestBindings } from '@loopback/rest';

import isEmpty from 'lodash/isEmpty';
import multer from 'multer';
import fs from 'node:fs';
import { join } from 'node:path';
import { ResourceAssetKeys } from '../common';

@api({ basePath: '/static-resources' })
export class StaticResourceController implements IController {
  protected logger: ApplicationLogger;
  private temporaryStorage: multer.StorageEngine;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
    @inject(RestBindings.Http.REQUEST) private request: Request,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
  ) {
    this.logger = LoggerFactory.getLogger([StaticResourceController.name]);
    this.temporaryStorage = multer.memoryStorage();
  }

  @post('/upload', {
    responses: {
      '200': {
        description: 'Upload files to resource folder',
        content: { 'application/json': {} },
      },
    },
  })
  uploadObject() {
    return new Promise((resolve, reject) => {
      multer({ storage: this.temporaryStorage }).array('files')(
        this.request,
        this.response,
        error => {
          if (error) {
            this.logger.error('[uploadObject] Fail to upload files! Error: %s', error);
            reject(error);
          }

          const files = (this.request?.files ?? []) as Array<IUploadFile>;
          const basePath = this.application.getSync<string>(ResourceAssetKeys.RESOURCE_BASE_PATH);

          Promise.all(
            files?.map(file => {
              const {
                originalname: originalName,
                // mimetype: mimeType,
                buffer,
                // size,
                // encoding
              } = file;

              if (!originalName || isEmpty(originalName)) {
                this.logger.error('[uploadObject] Invalid original name!');
                return;
              }

              const normalizeName = originalName.toLowerCase().replace(/ /g, '_');

              return new Promise((innerResolve, innerReject) => {
                const t = new Date().getTime();

                try {
                  const savedName = `${dayjs().format(Formatters.DATE_TIME_2)}_${normalizeName}`;
                  const path = join(basePath, savedName);

                  fs.writeFileSync(path, buffer);

                  this.logger.info(
                    '[upload] Uploaded: %s | Took: %s (ms)',
                    originalName,
                    new Date().getTime() - t,
                  );
                  innerResolve({ fileName: savedName });
                } catch (e) {
                  innerReject(e);
                }
              });
            }),
          )
            .then(rs => {
              resolve(rs);
            })
            .catch(reject);
        },
      );
    });
  }

  @get('/{object_name}/download')
  downloadObject(@param.path.string('object_name') objectName: string) {
    return new Promise((_, reject) => {
      const basePath = this.application.getSync<string>(ResourceAssetKeys.RESOURCE_BASE_PATH);
      const savedPath = join(basePath, objectName);

      fs.stat(savedPath, (error, stats) => {
        if (error) {
          reject(error);
          return;
        }

        const { size } = stats;
        this.response.set({
          'Content-Length': size,
          'Content-Disposition': `attachment; filename=${objectName}`,
        });

        const rs = fs.createReadStream(savedPath);
        rs.pipe(this.response);

        rs.on('error', e => {
          this.logger.error('[downloadObject] Error: %s', e);
          throw getError({
            message: `[downloadObject] Cannot download ${objectName}! Error while streaming data to client!`,
            statusCode: 500,
          });
        });

        rs.on('end', () => {
          this.response.end();
        });
      });
    });
  }
}
