export class App {
  static readonly TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
  static readonly TIMEZONE_OFFSET = -(new Date().getTimezoneOffset() / 60);
  static readonly DEFAULT_LOCALE = 'en.UTF-8';
  static readonly DEFAULT_DEBOUNCE_TIME = 500;
}

//--------------------------------------------------
export class Authentication {
  // Jwt
  static readonly TYPE_BASIC = 'Basic';
  static readonly TYPE_BEARER = 'Bearer';

  // Strategy
  static readonly STRATEGY_BASIC = 'basic';
  static readonly STRATEGY_JWT = 'jwt';
}

//--------------------------------------------------
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

//--------------------------------------------------
export class Environments {
  static readonly DEVELOPMENT = 'development';
  static readonly PRODUCTION = 'production';

  static readonly SCHEME_SET = new Set([this.DEVELOPMENT, this.PRODUCTION]);

  static isValid(input: string): boolean {
    return this.SCHEME_SET.has(input);
  }
}
