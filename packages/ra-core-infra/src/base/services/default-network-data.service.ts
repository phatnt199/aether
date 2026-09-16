import { getError } from '@venizia/ignis-inversion';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

import {
  type AnyType,
  App,
  HeaderConsts,
  type IAuthRecoveryOptions,
  type IGetRequestPropsParams,
  type IGetRequestPropsResult,
  type INoAuthOptions,
  LocalStorageKeys,
  RequestBodyTypes,
  RequestChannel,
  RequestCountData,
  RequestMethods,
  RequestTypes,
  type TConstValue,
  type TNoAuthPathRegex,
  type TRequestMethod,
  type TRequestType,
} from '@/common';
import { NodeFetchNetworkRequest } from '@/helpers';
import { isDefined } from '@/utilities';
import { BaseService } from './base.service';

const parseFilenameFromContentDisposition = (header: string): string | undefined => {
  if (!header) {
    return undefined;
  }

  const extMatch = header.match(/filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i);
  if (extMatch) {
    try {
      return decodeURIComponent(extMatch[2].trim());
    } catch {
      return extMatch[2].trim();
    }
  }

  const quotedMatch = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  const bareMatch = header.match(/filename\s*=\s*([^;]+)/i);
  if (bareMatch) {
    return bareMatch[1].trim();
  }

  return undefined;
};

const appendFormDataValue = (opts: { formData: FormData; key: string; value: unknown }) => {
  const { formData, key, value } = opts;

  if (!isDefined(value)) {
    return;
  }

  if (value instanceof Blob) {
    formData.append(key, value, (value as File).name);
    return;
  }

  formData.append(key, String(value));
};

const normalizeNoAuthPathRegex = (input?: TNoAuthPathRegex): RegExp[] => {
  if (!input) {
    return [];
  }

  const patterns = Array.isArray(input) ? input : [input];
  const rs: RegExp[] = [];

  for (const pattern of patterns) {
    if (!pattern) {
      continue;
    }

    if (pattern instanceof RegExp) {
      rs.push(pattern);
      continue;
    }

    try {
      rs.push(new RegExp(pattern));
    } catch {
      console.error(
        '[DefaultNetworkRequestService][normalizeNoAuthPathRegex] Invalid noAuthPathRegex pattern: %s',
        pattern,
      );
    }
  }

  return rs;
};

export class DefaultNetworkRequestService extends BaseService {
  protected authToken?: { type?: string; value: string };
  protected useAuth: boolean;
  protected noAuthPaths?: string[];
  protected noAuthPathRegexes: RegExp[];
  protected headers?: HeadersInit;
  protected networkRequest: NodeFetchNetworkRequest;
  protected baseUrl: string;
  protected authRecovery?: IAuthRecoveryOptions;

  private refreshing: Promise<boolean> | null = null;

  constructor(
    opts: INoAuthOptions & {
      name: string;
      baseUrl?: string;
      headers?: HeadersInit;
      authRecovery?: IAuthRecoveryOptions;
    },
  ) {
    super({ scope: DefaultNetworkRequestService.name });
    const {
      name,
      baseUrl = '',
      headers = {},
      useAuth = true,
      noAuthPaths,
      noAuthPathRegex,
      authRecovery,
    } = opts;

    this.headers = headers;
    this.useAuth = useAuth;
    this.noAuthPaths = noAuthPaths;
    this.noAuthPathRegexes = normalizeNoAuthPathRegex(noAuthPathRegex);
    this.baseUrl = baseUrl;
    this.authRecovery = authRecovery;
    this.networkRequest = new NodeFetchNetworkRequest({
      name,
      networkOptions: { baseUrl, headers },
    });
  }

  //-------------------------------------------------------------
  isNoAuthPath(opts: { resource?: string; paths?: string[] }): boolean {
    if (!this.useAuth) {
      return true;
    }

    const { resource, paths } = opts;

    if (resource && this.noAuthPaths?.includes(resource)) {
      return true;
    }

    if (!this.noAuthPathRegexes.length) {
      return false;
    }

    const candidates = [resource, paths?.join('/')].filter(
      (el): el is string => !!el && !isEmpty(el),
    );

    if (!candidates.length) {
      return false;
    }

    return this.noAuthPathRegexes.some((regex) => {
      return candidates.some((candidate) => {
        regex.lastIndex = 0;
        return regex.test(candidate);
      });
    });
  }

  //-------------------------------------------------------------
  setUseAuth(useAuth: boolean) {
    this.useAuth = useAuth;
  }

  //-------------------------------------------------------------
  setNoAuthPaths(noAuthPaths?: string[]) {
    this.noAuthPaths = noAuthPaths;
  }

  //-------------------------------------------------------------
  setNoAuthPathRegex(noAuthPathRegex?: TNoAuthPathRegex) {
    this.noAuthPathRegexes = normalizeNoAuthPathRegex(noAuthPathRegex);
  }

  //-------------------------------------------------------------
  private ensureRefreshed(): Promise<boolean> {
    const rec = this.authRecovery;
    if (!rec?.refreshToken) {
      return Promise.resolve(false);
    }

    this.refreshing ??= rec
      .refreshToken()
      .then(() => true)
      .catch(async () => {
        try {
          await rec.onAuthFailure?.();
        } catch {
          console.error(
            '[DefaultNetworkRequestService][ensureRefreshed] onAuthFailure callback failed',
          );
        }
        return false;
      })
      .finally(() => {
        this.refreshing = null;
      });

    return this.refreshing;
  }

  //-------------------------------------------------------------
  private canRecover(paths: string[]): boolean {
    const rec = this.authRecovery;
    if (!rec?.refreshToken) {
      return false;
    }

    if (this.isNoAuthPath({ resource: paths?.[0], paths })) {
      return false;
    }

    if (rec.refreshTokenPath && paths?.join('/').includes(rec.refreshTokenPath)) {
      return false;
    }

    return true;
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
  setAuthRecovery(authRecovery: Partial<IAuthRecoveryOptions>) {
    this.authRecovery = { ...this.authRecovery, ...authRecovery };
  }

  //-------------------------------------------------------------
  getAuthRecovery() {
    return this.authRecovery;
  }

  //-------------------------------------------------------------
  setHeaders(headers: HeadersInit) {
    this.headers = merge(this.headers, headers);
  }

  //-------------------------------------------------------------
  removeHeaders(keys: string[]) {
    if (!this.headers || !keys?.length) {
      return;
    }

    const headers = this.headers as Record<string, AnyType>;
    for (const key of keys) {
      delete headers[key];
    }
  }

  //-------------------------------------------------------------
  getRequestHeader(opts: { resource: string }) {
    const { resource } = opts;

    const defaultHeaders = {
      [HeaderConsts.TIMEZONE]: App.TIMEZONE,
      [HeaderConsts.TIMEZONE_OFFSET]: `${App.TIMEZONE_OFFSET}`,
      ...this.headers,
    };

    if (this.isNoAuthPath({ resource })) {
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
          const val = body[key];

          if (Array.isArray(val) || (typeof FileList !== 'undefined' && val instanceof FileList)) {
            Array.from(val as ArrayLike<unknown>).forEach((item) => {
              appendFormDataValue({ formData, key, value: item });
            });
            continue;
          }

          appendFormDataValue({ formData, key, value: val });
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

          const contentRange = headers?.get(HeaderConsts.CONTENT_RANGE) ?? `${_data.length}`;
          const total = parseInt(contentRange?.split('/').pop(), 10);

          return {
            data: _data as TData,
            count: dataFormatted?.count ?? _data.length,
            total,
          };
        }

        // --------------------------------------------------
        const _data = !Array.isArray(data) ? [data] : data;

        const contentRange = headers?.get(HeaderConsts.CONTENT_RANGE) ?? `${_data.length}`;
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
  private async parseResponse<ReturnType = AnyType>(opts: {
    response: Response;
    type: TRequestType;
    requestCountData?: TConstValue<typeof RequestCountData>;
  }): Promise<{
    data: ReturnType;
    count?: number;
    total?: number;
    filename?: string;
    contentDisposition?: string;
  }> {
    const { response: rs, type, requestCountData } = opts;

    if (rs.status === 204) {
      return { data: {} as ReturnType };
    }

    const contentType = (rs.headers?.get(HeaderConsts.CONTENT_TYPE) ?? '').toLowerCase();
    const contentDisposition = rs.headers?.get(HeaderConsts.CONTENT_DISPOSITION) ?? '';

    const isAttachment = HeaderConsts.ATTACHMENT_CONTENT_DISPOSITION_RE.test(contentDisposition);
    const isTextual = contentType !== '' && HeaderConsts.TEXTUAL_CONTENT_TYPE_RE.test(contentType);

    if (isAttachment || !isTextual) {
      const blob = await rs.blob();
      const filename = parseFilenameFromContentDisposition(contentDisposition);

      return {
        data: blob as ReturnType,
        ...(filename ? { filename } : {}),
        ...(contentDisposition ? { contentDisposition } : {}),
      };
    }

    const jsonRs = await rs.json();

    return this.convertResponse<ReturnType>({
      type,
      requestCountData,
      response: {
        headers: rs.headers ?? {},
        data: jsonRs as ReturnType,
      },
    });
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
    filename?: string;
    contentDisposition?: string;
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

    const url = this.networkRequest.getRequestUrl({ baseUrl, paths });

    const sendOnce = (sendHeaders?: HeadersInit) => {
      return this.networkRequest.getNetworkService().send({
        url,
        method,
        params: query,
        body: method === RequestMethods.GET ? undefined : body,
        headers: sendHeaders,
        configs: {},
      });
    };

    let rs = await sendOnce(headers);

    if (rs.status === 401 && this.canRecover(paths)) {
      const isRefreshed = await this.ensureRefreshed();

      if (isRefreshed) {
        const authHeader = this.getRequestAuthorizationHeader();
        const retryHeaders = {
          ...(headers as Record<string, AnyType>),
          [HeaderConsts.AUTHORIZATION]: authHeader.token,
          [HeaderConsts.X_AUTH_PROVIDER]: authHeader.provider,
        };

        rs = await sendOnce(retryHeaders);
      }
    }

    const status = rs.status;

    if (status < 200 || status >= 300) {
      const jsonRs = await rs.json();
      throw jsonRs?.error || jsonRs;
    }

    return this.parseResponse<ReturnType>({ response: rs, type, requestCountData });
  }
}
