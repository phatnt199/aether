import { AnyObject } from '@/common';
import { stringify } from '@/utilities/url.utility';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AbstractNetworkFetchableHelper, IRequestOptions } from './base-fetcher';

export interface IAxiosRequestOptions extends AxiosRequestConfig, IRequestOptions {
  url: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';
  params?: AnyObject;
  body?: AnyObject;
  headers?: AnyObject;
}

// -------------------------------------------------------------
export class AxiosFetcher extends AbstractNetworkFetchableHelper<
  'axios',
  IAxiosRequestOptions,
  AxiosResponse<any, any>
> {
  constructor(opts: { name: string; defaultConfigs: AxiosRequestConfig; logger?: any }) {
    const { defaultConfigs } = opts;
    super({ name: opts.name, variant: 'axios', worker: axios.create({ ...defaultConfigs }) });

    opts?.logger?.info('Creating new network request worker instance! Name: %s', opts.name);
  }

  // -------------------------------------------------------------
  // SEND REQUEST
  // -------------------------------------------------------------
  override send<T = any>(opts: IAxiosRequestOptions, logger?: any) {
    const { url, method = 'get', params = {}, body: data, headers, ...rest } = opts;
    const props: AxiosRequestConfig = {
      url,
      method,
      params,
      data,
      headers,
      paramsSerializer: { serialize: p => stringify(p) },
      ...rest,
    };

    logger?.info('[send] URL: %s | Props: %o', url, props);
    return this.worker.request<T>(props);
  }
}
