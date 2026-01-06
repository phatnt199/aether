export class App {
  static readonly TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
  static readonly TIMEZONE_OFFSET = -(new Date().getTimezoneOffset() / 60);
  static readonly DEFAULT_LOCALE = 'en.UTF-8';
  static readonly DEFAULT_DEBOUNCE_TIME = 500;
}

// --------------------------------------------------
export class Authentication {
  // Jwt
  static readonly TYPE_BASIC = 'Basic';
  static readonly TYPE_BEARER = 'Bearer';

  // Strategy
  static readonly STRATEGY_BASIC = 'basic';
  static readonly STRATEGY_JWT = 'jwt';
}

// --------------------------------------------------
export class RequestMethods {
  static readonly HEAD = 'HEAD';
  static readonly OPTIONS = 'OPTIONS';
  static readonly GET = 'GET';
  static readonly POST = 'POST';
  static readonly PUT = 'PUT';
  static readonly PATCH = 'PATCH';
  static readonly DELETE = 'DELETE';

  static readonly SCHEME_SET = new Set([
    this.HEAD,
    this.OPTIONS,
    this.GET,
    this.POST,
    this.PUT,
    this.PATCH,
    this.DELETE,
  ]);

  static isValid(input: string): boolean {
    return this.SCHEME_SET.has(input);
  }
}

// --------------------------------------------------
export class RequestTypes {
  static readonly SEND = 'SEND';

  // react-admin
  static readonly GET_LIST = 'GET_LIST';
  static readonly GET_ONE = 'GET_ONE';
  static readonly GET_MANY = 'GET_MANY';
  static readonly GET_MANY_REFERENCE = 'GET_MANY_REFERENCE';
  static readonly CREATE = 'CREATE';
  static readonly UPDATE = 'UPDATE';
  static readonly UPDATE_MANY = 'UPDATE_MANY';
  static readonly DELETE = 'DELETE';
  static readonly DELETE_MANY = 'DELETE_MANY';

  static readonly SCHEME_SET = new Set([
    this.SEND,
    this.GET_ONE,
    this.GET_LIST,
    this.GET_MANY,
    this.GET_MANY_REFERENCE,
    this.CREATE,
    this.UPDATE,
    this.UPDATE_MANY,
    this.DELETE,
    this.DELETE_MANY,
  ]);

  static isValid(input: string): boolean {
    return this.SCHEME_SET.has(input);
  }
}

// --------------------------------------------------
export class RequestBodyTypes {
  static readonly NONE = 'none';
  static readonly FORM_DATA = 'form-data';
  static readonly FORM_URL_ENCODED = 'x-www-form-urlencoded';
  static readonly JSON = 'json';
  static readonly BINARY = 'binary';

  static readonly SCHEME_SET = new Set([
    this.NONE,
    this.FORM_DATA,
    this.FORM_URL_ENCODED,
    this.JSON,
    this.BINARY,
  ]);

  static isValid(input: string): boolean {
    return this.SCHEME_SET.has(input);
  }
}

// --------------------------------------------------
export class Environments {
  static readonly DEVELOPMENT = 'development';
  static readonly PRODUCTION = 'production';

  static readonly SCHEME_SET = new Set([this.DEVELOPMENT, this.PRODUCTION]);

  static isValid(input: string): boolean {
    return this.SCHEME_SET.has(input);
  }
}

// --------------------------------------------------
export class HeaderConsts {
  static readonly CONTENT_TYPE = 'content-type';

  /**
   * content-range: <unit> <range-start>-<range-end>/<size>
   * @format unit start-end/total
   * - unit: Usually bytes/items/records.
   * - start: The zero-indexed position of the first byte/item/record in the range.
   * - end: The zero-indexed position of the last byte/item/record in the range (inclusive).
   * - total: The total length of the entity body (or * if unknown).
   */
  static readonly CONTENT_RANGE = 'content-range';

  static readonly AUTHORIZATION = 'authorization';
  static readonly X_AUTH_PROVIDER = 'x-auth-provider';
  static readonly X_LOCALE = 'x-locale';

  static readonly TIMEZONE = 'Timezone';
  static readonly TIMEZONE_OFFSET = 'Timezone-Offset';

  static readonly REQUEST_TRACING_ID = 'x-request-id';
  static readonly REQUEST_DEVICE_INFO = 'x-device-info';
  static readonly REQUEST_CHANNEL = 'x-request-channel';

  static readonly REQUEST_COUNT_DATA = 'x-request-count';
  static readonly RESPONSE_COUNT_DATA = 'x-response-count';

  static readonly RESPONSE_FORMAT = 'x-response-format';
}

// --------------------------------------------------
export class RequestChannel {
  static readonly WEB = '100_WEB';
}

// --------------------------------------------------
export class RequestCountData {
  /**
   * @description Only the data is returned in the response body
   */
  static readonly DATA_ONLY = '0';

  /**
   * @description Both data and count are returned in the response body
   */
  static readonly DATA_WITH_COUNT = '1';
}
