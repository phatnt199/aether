import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/components';
import { CoreBindings } from '@/common/bindings';
import { ValueOrPromise } from '@/common/types';
import { Binding } from '@/helpers/inversion';
import { inject } from '@/helpers/inversion/decorators';
import { getError } from '@/utilities/error.utility';
import { Hono } from 'hono';
import { SwaggerBindingKeys } from './keys';
import { ISwaggerOptions } from './types';

const DEFAULT_SWAGGER_OPTIONS: ISwaggerOptions = {
  restOptions: {
    path: {
      base: '/doc',
      doc: '/openapi.json',
      ui: 'explorer',
    },
  },
  explorer: {
    openapi: '3.1.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for your service',
    },
  },
};

const openApiDoc = {
  openapi: '3.1.0',
  info: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'API documentation for your service',
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    // Add more endpoints as needed
  },
};

export class SwaggerComponent extends BaseComponent {
  private route: Hono;

  constructor(
    @inject({ key: CoreBindings.APPLICATION_INSTANCE }) private application: BaseApplication,
  ) {
    super({ scope: SwaggerComponent.name });

    this.bindings = {
      [SwaggerBindingKeys.SWAGGER_OPTIONS]: Binding.bind<ISwaggerOptions>({
        key: SwaggerBindingKeys.SWAGGER_OPTIONS,
      }).toValue(DEFAULT_SWAGGER_OPTIONS),
    };

    this.route = new Hono({ strict: true });
  }

  override binding(): ValueOrPromise<void> {
    return new Promise((resolve, reject) => {
      import('@hono/swagger-ui')
        .then(module => {
          const { swaggerUI } = module;

          const swaggerOptions =
            this.application.get<ISwaggerOptions>({
              key: SwaggerBindingKeys.SWAGGER_OPTIONS,
              optional: true,
            }) ?? DEFAULT_SWAGGER_OPTIONS;
          const { restOptions } = swaggerOptions;

          this.route.get(restOptions.path.doc, async context => {
            return context.json(openApiDoc);
          });

          const config = this.application.getProjectConfigs();
          this.route.get(
            restOptions.path.ui,
            swaggerUI({
              url: [config.basePath ?? '', restOptions.path.base, restOptions.path.doc].join(''),
            }),
          );

          const applicationRoute = this.application.getServer();
          applicationRoute.route(restOptions.path.base, this.route);
          resolve();
        })
        .catch(error => {
          this.logger.error('[binding] Failed to import @hono/swagger-ui | Error: %s', error);
          reject(
            getError({
              message: `[start] @hono/swagger-ui is required for SwaggerComponent. Please install '@hono/swagger-ui'`,
            }),
          );
        });
    });
  }
}
