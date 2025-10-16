import { stringify } from '@/utilities/url.utility';
import { AbstractNetworkFetchableHelper } from './base-fetcher';

export interface INodeFetchRequestOptions extends RequestInit {
  url: string;
  params?: Record<string | symbol, any>;
}

// -------------------------------------------------------------
export class NodeFetcher extends AbstractNetworkFetchableHelper<
  'node-fetch',
  INodeFetchRequestOptions,
  Awaited<ReturnType<typeof fetch>>
> {
  private defaultConfigs: RequestInit;

  constructor(opts: { name: string; defaultConfigs: RequestInit; logger?: any }) {
    super({ name: opts.name, variant: 'node-fetch' });
    const { name, defaultConfigs } = opts;
    this.name = name;
    opts?.logger?.info('Creating new network request worker instance! Name: %s', this.name);

    this.defaultConfigs = defaultConfigs;
  }

  // -------------------------------------------------------------
  // SEND REQUEST
  // -------------------------------------------------------------
  override send(opts: INodeFetchRequestOptions, logger?: any) {
    const { url, method = 'get', params, body, headers } = opts;
    const requestConfigs: RequestInit = {
      ...this.defaultConfigs,
      method,
      body,
      headers,
    };

    let requestUrl = '';
    const urlParts = [url];
    if (params) {
      urlParts.push(stringify(params));
      requestUrl = urlParts.join('?');
    } else {
      requestUrl = urlParts.join();
    }

    logger?.info('[send] URL: %s | Props: %o', url, requestConfigs);
    return fetch(requestUrl, requestConfigs);
  }
}
