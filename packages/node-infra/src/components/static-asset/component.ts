import { MinioHelper } from '@/helpers';
import { getError } from '@/utilities';
import { Binding, CoreBindings, inject } from '@loopback/core';
import { ClientOptions } from 'minio';
import { ResourceAssetKeys } from './common';
import { StaticAssetController, StaticResourceController } from './controllers';
import { BaseComponent } from '@/base/base.component';
import { BaseApplication } from '@/base/applications';

export class StaticAssetComponent extends BaseComponent {
  bindings: Binding[] = [
    Binding.bind(ResourceAssetKeys.COMPONENT_OPTIONS).to({
      useMinioAsset: true,
      useStaticResource: true,
      resourceBasePath: './',
    }),
    Binding.bind(ResourceAssetKeys.CONNECTION_OPTIONS).to(null),
  ];

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
  ) {
    super({ scope: StaticAssetComponent.name });
    this.binding();
  }

  defineControllers(opts: { useMinioAsset: boolean; useStaticResource: boolean }) {
    const { useMinioAsset, useStaticResource } = opts;

    if (useMinioAsset) {
      this.application.controller(StaticAssetController);
    }

    if (useStaticResource) {
      this.application.controller(StaticResourceController);
    }
  }

  binding() {
    if (!this.application) {
      throw getError({
        statusCode: 500,
        message: '[binding] Invalid application to bind AuthenticateComponent',
      });
    }

    this.logger.info('[binding] Binding static asset for application...');

    const componentOptions = this.application.getSync<{
      useMinioAsset: boolean;
      useStaticResource: boolean;
      resourceBasePath: string;
    }>(ResourceAssetKeys.COMPONENT_OPTIONS);

    const { useMinioAsset, useStaticResource, resourceBasePath } = componentOptions;

    if (useMinioAsset) {
      const connectionOptions = this.application.getSync<ClientOptions>(
        ResourceAssetKeys.CONNECTION_OPTIONS,
      );
      const minioHelper = new MinioHelper(connectionOptions);
      this.application.bind(ResourceAssetKeys.MINIO_INSTANCE).to(minioHelper);
    }

    if (useStaticResource) {
      this.application.bind(ResourceAssetKeys.RESOURCE_BASE_PATH).to(resourceBasePath);
    }

    this.defineControllers({ useMinioAsset, useStaticResource });
  }
}
