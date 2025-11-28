import isEmpty from 'lodash/isEmpty';

import {
  AnyType,
  App,
  IGetRequestPropsParams,
  IGetRequestPropsResult,
  LocalStorageKeys,
  RequestBodyTypes,
  RequestMethods,
  RequestTypes,
  TRequestMethod,
  TRequestType,
} from '@/common';
import { getError } from '@/utilities';
import { NodeFetchNetworkRequest } from '@/helpers';
import { BaseService } from './base.service';

export class DefaultNetworkRequestService extends BaseService {
  protected authToken?: { type?: string; value: string };
  protected noAuthPaths?: string[];
  protected headers?: HeadersInit;
  protected networkRequest: NodeFetchNetworkRequest;
  protected baseUrl: string;

  constructor(opts: {
    name: string;
    baseUrl?: string;
    headers?: HeadersInit;
    noAuthPaths?: string[];
  }) {
    super({ scope: DefaultNetworkRequestService.name });
    const { name, baseUrl = '', headers = {}, noAuthPaths } = opts;

    this.headers = headers;
    this.noAuthPaths = noAuthPaths;
    this.baseUrl = baseUrl;
    this.networkRequest = new NodeFetchNetworkRequest({
      name,
      networkOptions: { baseUrl, headers },
    });
  }

  //-------------------------------------------------------------
  getRequestAuthorizationHeader() {
    const authToken =
      this.authToken || JSON.parse(localStorage.getItem(LocalStorageKeys.KEY_AUTH_TOKEN) || '{}');

    if (!authToken?.value) {
      throw getError({
        message: '[dataProvider][getAuthHeader] Invalid auth token to fetch!',
        statusCode: 401,
      });
    }

    return {
      provider: authToken?.provider,
      token: `${authToken?.type || 'Bearer'} ${authToken.value}`,
    };
  }

  //-------------------------------------------------------------
  setAuthToken(opts: { type?: string; value: string }) {
    const { type, value } = opts;
    this.authToken = { type, value };
  }

  //-------------------------------------------------------------
  getRequestHeader(opts: { resource: string }) {
    const { resource } = opts;

    const defaultHeaders = {
      ['Timezone']: App.TIMEZONE,
      ['Timezone-Offset']: `${App.TIMEZONE_OFFSET}`,
      ...this.headers,
    };

    if (this.noAuthPaths?.includes(resource)) {
      return defaultHeaders;
    }

    const authHeader = this.getRequestAuthorizationHeader();

    return {
      ...defaultHeaders,
      ['x-auth-provider']: authHeader.provider,
      ['authorization']: authHeader.token,
    };
  }

  //-------------------------------------------------------------
  getRequestProps(params: IGetRequestPropsParams) {
    const { bodyType, body, resource } = params;
    const headers = this.getRequestHeader({ resource });

    const rs: IGetRequestPropsResult = { headers, body };

    switch (bodyType) {
      case RequestBodyTypes.FORM_URL_ENCODED: {
        rs.headers = {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        };

        const formData = new FormData();

        for (const key in body) {
          if (!body[key]) {
            continue;
          }
          formData.append(key, body[key]);
        }

        rs.body = formData;

        break;
      }
      case RequestBodyTypes.FORM_DATA: {
        rs.headers = headers;

        const formData = new FormData();

        for (const key in body) {
          const val = body[key] as File | File[] | FileList | undefined;
          if (!val) {
            continue;
          }

          if (val instanceof FileList) {
            Array.from(val).forEach(item => {
              formData.append(key, item, item.name);
            });
            continue;
          }

          if (Array.isArray(val)) {
            val.forEach(item => {
              formData.append(key, item, item.name);
            });
            continue;
          }

          formData.append(key, val, val.name);
          continue;
        }

        rs.body = formData;

        break;
      }
      default: {
        rs.headers = {
          ...headers,
          'Content-Type': 'application/json',
        };
        rs.body = body;
        break;
      }
    }

    return rs;
  }

  //-------------------------------------------------------------
  convertResponse<TData = AnyType>(opts: {
    response: { data: TData; headers: Record<string, any> };
    type: string;
  }): { data: TData; total?: number } {
    const {
      response: { data, headers },
      type,
    } = opts;

    switch (type) {
      case RequestTypes.GET_LIST:
      case RequestTypes.GET_MANY_REFERENCE: {
        const _data = !Array.isArray(data) ? [data] : data;

        // content-range: <unit> <range-start>-<range-end>/<size>
        // TODO: Handle content range not use `getListVariant`
        const contentRange =
          (headers?.get('content-range') || headers?.get['Content-Range']) ?? _data.length;

        return {
          data: _data as TData,
          total: parseInt(contentRange.split('/').pop(), 10),
        };
      }
      default: {
        return { data };
      }
    }
  }

  //-------------------------------------------------------------
  async doRequest<ReturnType = AnyType>(
    opts: IGetRequestPropsResult & {
      baseUrl?: string;
      query?: any;
      type: TRequestType;
      method: TRequestMethod;
      paths: string[];
    },
  ): Promise<{ data: ReturnType; total?: number }> {
    const { baseUrl = this.baseUrl, type, method, paths, body, headers, query } = opts;

    if (!baseUrl || isEmpty(baseUrl)) {
      throw getError({
        message: '[doRequest] Invalid baseUrl to send request!',
      });
    }

    const url = this.networkRequest.getRequestUrl({ baseUrl: this.baseUrl, paths });

    const rs = await this.networkRequest.getNetworkService().send({
      url,
      method,
      params: query,
      body: method === RequestMethods.GET ? undefined : body,
      headers,
      configs: {},
    });

    const status = rs.status;

    if (status < 200 || status >= 300) {
      const jsonRs = await rs.json();
      throw getError(jsonRs?.error);
    }

    let tempRs: {
      response: { data: ReturnType; headers: Record<string, any> };
      type: string;
    } = {
      response: { data: {} as ReturnType, headers: rs.headers ?? {} },
      type,
    };

    switch (status) {
      case 204: {
        tempRs = { ...tempRs, response: { ...tempRs.response, data: {} as ReturnType } };
        break;
      }
      default: {
        if (
          [rs.headers?.get('content-type'), rs.headers?.get('Content-Type')].includes(
            'application/octet-stream',
          )
        ) {
          const blob = await rs.blob();

          tempRs = {
            ...tempRs,
            response: { ...tempRs.response, data: blob as ReturnType },
          };

          break;
        }

        const jsonRs = await rs.json();
        tempRs = {
          ...tempRs,
          response: { ...tempRs.response, data: jsonRs as ReturnType },
        };

        break;
      }
    }

    const _rs = this.convertResponse<ReturnType>(tempRs);
    return _rs;
  }
}
