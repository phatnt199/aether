import { inject } from '@loopback/context';

import { BaseProvider } from './base.provider';
import { OpenApiNetworkService } from '@/base/services';
import { CoreBindings, ValueOrPromise } from '@/common';

export interface IOpenApiDataProviderOptions {
  url: string;
  noAuthPaths?: string[];
  headers?: HeadersInit;
}

export class OpenApiDataProvider<TPaths extends Record<string, any>> extends BaseProvider<
  OpenApiNetworkService<TPaths>
> {
  constructor(
    @inject(CoreBindings.OPENAPI_DATA_PROVIDER_OPTIONS)
    protected options: IOpenApiDataProviderOptions,
  ) {
    super({ scope: OpenApiDataProvider.name });
  }

  override value(): ValueOrPromise<OpenApiNetworkService<TPaths>> {
    this.logger.info('[value] Creating OpenApiNetworkService | BaseURL: %s', this.options.url);

    return new OpenApiNetworkService<TPaths>({
      name: 'openapi-network-service',
      baseUrl: this.options.url,
      noAuthPaths: this.options.noAuthPaths,
      headers: this.options.headers,
    });
  }
}
