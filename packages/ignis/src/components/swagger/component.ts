import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/components';
import { inject } from '@/base/metadata';
import { CoreBindings } from '@/common/bindings';
import { Binding } from '@/helpers/inversion';
import { validateModule } from '@/utilities/module.utility';
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
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for your service',
    },
  },
};

export class SwaggerComponent extends BaseComponent {
  constructor(
    @inject({ key: CoreBindings.APPLICATION_INSTANCE }) private application: BaseApplication,
  ) {
    super({ scope: SwaggerComponent.name });

    this.bindings = {
      [SwaggerBindingKeys.SWAGGER_OPTIONS]: Binding.bind<ISwaggerOptions>({
        key: SwaggerBindingKeys.SWAGGER_OPTIONS,
      }).toValue(DEFAULT_SWAGGER_OPTIONS),
    };
  }

  override async binding() {
    validateModule({ scope: SwaggerComponent.name, modules: ['@hono/swagger-ui'] });
    const { swaggerUI } = await import('@hono/swagger-ui');

    const swaggerOptions =
      this.application.get<ISwaggerOptions>({
        key: SwaggerBindingKeys.SWAGGER_OPTIONS,
        isOptional: true,
      }) ?? DEFAULT_SWAGGER_OPTIONS;

    const rootRouter = this.application.getRootRouter();
    const configs = this.application.getProjectConfigs();

    const { restOptions, explorer } = swaggerOptions;

    // OpenAPI Documentation URL
    explorer.info.version = await this.application.getApplicationVersion();

    // Application Server Urls
    if (!explorer.servers?.length) {
      explorer.servers = [
        {
          url: ['http://', this.application.getServerAddress(), configs.basePath ?? ''].join(''),
          description: 'Application Server URL',
        },
      ];
    }

    const docPath = [
      restOptions.path.base.startsWith('/') ? '' : '/',
      restOptions.path.base,
      restOptions.path.doc.startsWith('/') ? '' : '/',
      restOptions.path.doc,
    ].join('');

    rootRouter.doc(docPath, explorer);

    rootRouter.get(
      [
        restOptions.path.base.startsWith('/') ? '' : '/',
        restOptions.path.base,
        restOptions.path.ui.startsWith('/') ? '' : '/',
        restOptions.path.ui,
      ].join(''),
      swaggerUI({
        url: [configs.basePath ?? '', docPath].join(''),
      }),
    );
  }
}
