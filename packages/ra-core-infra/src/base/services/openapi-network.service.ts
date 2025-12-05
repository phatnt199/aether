import { DefaultNetworkRequestService } from './default-network-data.service';
import { transformOpenApiError } from '@/utilities/openapi-error.utility';

import type { Client } from 'openapi-fetch';
import { PathsWithMethod } from 'openapi-typescript-helpers';

export class OpenApiNetworkService<
  TPaths extends Record<string, any>,
> extends DefaultNetworkRequestService {
  protected client: Client<TPaths> | null = null;

  /** In-flight client initialization promise to prevent duplicate imports */
  protected clientPromise: Promise<Client<TPaths>> | null = null;

  constructor(opts: {
    name: string;
    baseUrl?: string;
    headers?: HeadersInit;
    noAuthPaths?: string[];
  }) {
    super(opts);
  }

  private async getClient(): Promise<Client<TPaths>> {
    if (this.client) {
      return this.client;
    }

    // Return in-flight promise if client is being initialized
    if (this.clientPromise) {
      return this.clientPromise;
    }

    this.clientPromise = (async () => {
      try {
        const openapiModule = await import('openapi-fetch');
        const createClient = openapiModule.default;

        this.client = createClient<TPaths>({
          baseUrl: this.baseUrl,
          headers: this.headers as Record<string, string>,
        });

        this.logger.info('[getClient] OpenAPI client initialized | BaseURL: %s', this.baseUrl);
        return this.client;
      } catch (error) {
        this.clientPromise = null;
        this.logger.error('[getClient] Failed to import openapi-fetch:', error);
        throw new Error(
          'openapi-fetch is not installed. Please install it as a peer dependency:\n' +
            '  npm install openapi-fetch openapi-typescript-helpers\n' +
            '  # or\n' +
            '  bun add openapi-fetch openapi-typescript-helpers',
        );
      }
    })();

    return this.clientPromise;
  }

  protected extractResource(url: string): string {
    let path = url;

    const firstBrace = path.indexOf('{');
    if (firstBrace !== -1) {
      path = path.substring(0, firstBrace).replace(/\/$/, '');
    }

    return path;
  }

  async get<TPath extends PathsWithMethod<TPaths, 'get'>>(
    url: TPath,
    options?: Parameters<Client<TPaths>['GET']>[1],
  ) {
    const client = await this.getClient();
    const resource = this.extractResource(url as string);
    const headers = this.getRequestHeader({ resource });

    const response = await client.GET(url, {
      ...(options as any),
      headers: {
        ...headers,
        ...(options && 'headers' in options ? (options.headers as any) : {}),
      },
    } as any);

    if (response.error) {
      throw transformOpenApiError(response.error, response.response);
    }

    return response;
  }

  async post<TPath extends PathsWithMethod<TPaths, 'post'>>(
    url: TPath,
    options?: Parameters<Client<TPaths>['POST']>[1],
  ) {
    const client = await this.getClient();
    const resource = this.extractResource(url as string);
    const headers = this.getRequestHeader({ resource });

    const response = await client.POST(url, {
      ...(options as any),
      headers: {
        ...headers,
        ...(options && 'headers' in options ? (options.headers as any) : {}),
      },
    } as any);

    if (response.error) {
      throw transformOpenApiError(response.error, response.response);
    }

    return response;
  }

  async put<TPath extends PathsWithMethod<TPaths, 'put'>>(
    url: TPath,
    options?: Parameters<Client<TPaths>['PUT']>[1],
  ) {
    const client = await this.getClient();
    const resource = this.extractResource(url as string);
    const headers = this.getRequestHeader({ resource });

    const response = await client.PUT(url, {
      ...(options as any),
      headers: {
        ...headers,
        ...(options && 'headers' in options ? (options.headers as any) : {}),
      },
    } as any);

    if (response.error) {
      throw transformOpenApiError(response.error, response.response);
    }

    return response;
  }

  async patch<TPath extends PathsWithMethod<TPaths, 'patch'>>(
    url: TPath,
    options?: Parameters<Client<TPaths>['PATCH']>[1],
  ) {
    const client = await this.getClient();
    const resource = this.extractResource(url as string);
    const headers = this.getRequestHeader({ resource });

    const response = await client.PATCH(url, {
      ...(options as any),
      headers: {
        ...headers,
        ...(options && 'headers' in options ? (options.headers as any) : {}),
      },
    } as any);

    if (response.error) {
      throw transformOpenApiError(response.error, response.response);
    }

    return response;
  }

  async delete<TPath extends PathsWithMethod<TPaths, 'delete'>>(
    url: TPath,
    options?: Parameters<Client<TPaths>['DELETE']>[1],
  ) {
    const client = await this.getClient();
    const resource = this.extractResource(url as string);
    const headers = this.getRequestHeader({ resource });

    const response = await client.DELETE(url, {
      ...(options as any),
      headers: {
        ...headers,
        ...(options && 'headers' in options ? (options.headers as any) : {}),
      },
    } as any);

    if (response.error) {
      throw transformOpenApiError(response.error, response.response);
    }

    return response;
  }
}
