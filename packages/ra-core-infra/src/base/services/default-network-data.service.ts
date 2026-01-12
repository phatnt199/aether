import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

import {
  AnyType,
  App,
  IGetRequestPropsParams,
  IGetRequestPropsResult,
  LocalStorageKeys,
  RequestBodyTypes,
  RequestChannel,
  RequestCountData,
  HeaderConsts,
  RequestMethods,
  RequestTypes,
  TConstValue,
  TRequestMethod,
  TRequestType,
} from '@/common';
import { NodeFetchNetworkRequest } from '@/helpers';
import { getError } from '@/utilities';
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
  setHeaders(headers: HeadersInit) {
    this.headers = merge(this.headers, headers);
  }

  //-------------------------------------------------------------
  getRequestHeader(opts: { resource: string }) {
    const { resource } = opts;

    const defaultHeaders = {
      [HeaderConsts.TIMEZONE]: App.TIMEZONE,
      [HeaderConsts.TIMEZONE_OFFSET]: `${App.TIMEZONE_OFFSET}`,
      ...this.headers,
    };

    if (this.noAuthPaths?.includes(resource)) {
      return defaultHeaders;
    }

    const authHeader = this.getRequestAuthorizationHeader();

    return {
      ...defaultHeaders,
      [HeaderConsts.X_AUTH_PROVIDER]: authHeader.provider,
      [HeaderConsts.AUTHORIZATION]: authHeader.token,
    };
  }

  //-------------------------------------------------------------
  getRequestProps(params: IGetRequestPropsParams) {
    const {
      bodyType,
      body,
      resource,
      restDataProviderOptions,
      applicationInfo,
      requestCountData = RequestCountData.DATA_ONLY,
    } = params;
    const requestTracingId = restDataProviderOptions.requestTracingId;
    const channel = restDataProviderOptions.requestTracingChannel || RequestChannel.WEB;

    const headers: Record<string, AnyType> = {
      ...this.getRequestHeader({ resource }),
      [HeaderConsts.REQUEST_CHANNEL]: channel,
      [HeaderConsts.REQUEST_COUNT_DATA]: requestCountData,
      [HeaderConsts.REQUEST_TRACING_ID]:
        requestTracingId instanceof Function
          ? requestTracingId({ applicationInfo })
          : `${applicationInfo.name}_${crypto.randomUUID()}`,
    };

    const rs: IGetRequestPropsResult = { headers, body };

    switch (bodyType) {
      case RequestBodyTypes.FORM_URL_ENCODED: {
        rs.headers = {
          ...headers,
          [HeaderConsts.CONTENT_TYPE]: 'application/x-www-form-urlencoded',
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
          [HeaderConsts.CONTENT_TYPE]: 'application/json',
        };
        rs.body = body;
        break;
      }
    }

    return rs;
  }

  //-------------------------------------------------------------
  convertResponse<TData = AnyType>(opts: {
    response: {
      data: TData | { data: TData; count?: number };
      headers: Record<string, AnyType>;
    };
    type: string;
    requestCountData?: TConstValue<typeof RequestCountData>;
  }): {
    data: TData;
    count?: number;
    total?: number;
  } {
    const {
      response: { data, headers },
      type,
      requestCountData,
    } = opts;

    switch (type) {
      case RequestTypes.GET_LIST:
      case RequestTypes.GET_MANY_REFERENCE: {
        if (requestCountData === RequestCountData.DATA_WITH_COUNT) {
          if (!('data' in (data as AnyType)) || !('count' in (data as AnyType))) {
            throw getError({
              message: `[convertResponse] Invalid response format for requestCountData=${RequestCountData.DATA_WITH_COUNT} !`,
            });
          }

          const dataFormatted = data as { data: TData; count?: number };

          const _data = !Array.isArray(dataFormatted.data)
            ? [dataFormatted.data]
            : dataFormatted.data;

          const contentRange =
            (headers?.get('content-range') || headers?.get['Content-Range']) ?? `${_data.length}`;
          const total = parseInt(contentRange?.split('/').pop(), 10);

          return {
            data: _data as TData,
            count: dataFormatted?.count ?? _data.length,
            total,
          };
        }

        // --------------------------------------------------
        const _data = !Array.isArray(data) ? [data] : data;

        const contentRange =
          (headers?.get('content-range') || headers?.get['Content-Range']) ?? `${_data.length}`;
        const total = parseInt(contentRange?.split('/').pop(), 10);

        return {
          data: _data as TData,
          total,
        };
      }
      default: {
        if (requestCountData === RequestCountData.DATA_WITH_COUNT) {
          return data as { data: TData; count?: number };
        }

        const responseCount = headers?.get(HeaderConsts.RESPONSE_COUNT_DATA);
        return {
          data: data as TData,
          count: parseInt(responseCount, 10),
        };
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
      requestCountData?: TConstValue<typeof RequestCountData>;
    },
  ): Promise<{
    data: ReturnType;
    count?: number;
    total?: number; // GET_LIST || GET_MANY_REFERENCE
  }> {
    const {
      baseUrl = this.baseUrl,
      type,
      method,
      paths,
      body,
      headers,
      query,
      requestCountData,
    } = opts;

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
      throw getError(jsonRs?.error || jsonRs);
    }

    if (status === 204) {
      return { data: {} as ReturnType };
    }

    if (
      [rs.headers?.get('content-type'), rs.headers?.get('Content-Type')].some(h => {
        return (
          h?.endsWith('octet-stream') || h?.startsWith('image/') // application/octet-stream | binary/octet-stream || image/png | image/jpg
        );
      })
    ) {
      const blob = await rs.blob();

      return {
        data: blob as ReturnType,
      };
    }

    const jsonRs = await rs.json();

    const result = this.convertResponse<ReturnType>({
      type,
      requestCountData,
      response: {
        headers: rs.headers ?? {},
        data: jsonRs as ReturnType,
      },
    });

    return result;
  }
}
