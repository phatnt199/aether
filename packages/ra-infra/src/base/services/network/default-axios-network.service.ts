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
import isEmpty from 'lodash/isEmpty';
import { AxiosNetworkRequest } from '@/helpers';

export class DefaultAxiosNetworkRequestService extends AxiosNetworkRequest {
  protected authToken?: { type?: string; value: string };
  protected noAuthPaths?: string[];
  protected headers?: HeadersInit;

  constructor(opts: {
    name: string;
    baseUrl?: string;
    headers?: HeadersInit;
    noAuthPaths?: string[];
    withCredentials?: boolean;
  }) {
    const { name, baseUrl, headers, noAuthPaths, withCredentials } = opts;
    super({
      name,
      networkOptions: {
        baseUrl,
        headers,
        timeout: 60 * 1000,
        withCredentials,
      },
    });

    this.headers = headers;
    this.noAuthPaths = noAuthPaths;
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
    const { bodyType, body, file, resource } = params;
    const headers = this.getRequestHeader({ resource });

    const rs: IGetRequestPropsResult = { headers, body };

    switch (bodyType) {
      case RequestBodyTypes.FORM_URL_ENCODED: {
        // Use URLSearchParams for application/x-www-form-urlencoded
        const params = new URLSearchParams();

        for (const key in body) {
          if (body[key] !== undefined && body[key] !== null) {
            params.append(key, String(body[key]));
          }
        }

        rs.headers = {
          ...headers,
          'content-type': 'application/x-www-form-urlencoded',
        };
        rs.body = params;

        break;
      }
      case RequestBodyTypes.FORM_DATA: {
        // Don't set Content-Type for FormData - let Axios handle it with boundary
        const formData = new FormData();

        if (file) {
          formData.append('file', file, file.name);
        }

        // Add other body fields to FormData if present
        if (body) {
          for (const key in body) {
            if (body[key] !== undefined && body[key] !== null) {
              formData.append(key, body[key]);
            }
          }
        }

        rs.headers = headers;
        rs.body = formData;

        break;
      }
      default: {
        // For JSON, let Axios handle Content-Type automatically
        rs.headers = headers;
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
          (headers?.['content-range'] || headers?.['Content-Range']) ?? _data.length;

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

    const url = this.getRequestUrl({ baseUrl, paths });

    const networkService = this.getNetworkService();
    const rs = await networkService.send({
      url,
      method,
      params: query,
      body: method === RequestMethods.GET ? undefined : body,
      headers,
      configs: {},
    });

    const jsonRs = rs.data;

    const status = rs.status;

    if (status < 200 || status >= 300) {
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
        const contentType = rs.headers?.['content-type'] || rs.headers?.['Content-Type'];
        if (contentType === 'application/octet-stream') {
          // For Axios, blob data is already in rs.data
          tempRs = {
            ...tempRs,
            response: { ...tempRs.response, data: rs.data as ReturnType },
          };

          break;
        }

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
