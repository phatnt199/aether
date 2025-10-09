export class App {
  static readonly APPLICATION_NAME = process.env.APP_ENV_APPLICATION_NAME ?? 'APP';
  static readonly APPLICATION_SECRET =
    process.env.APP_ENV_APPLICATION_SECRET ?? 'application.secret';

  static readonly DEFAULT_LOCALE = 'en.UTF-8';
  static readonly DEFAULT_EXPLORER_PATH = '/explorer';

  static readonly DEFAULT_QUERY_LIMIT = 50;
}

export class ConstantValidator<T> {
  private schemeSet: Set<T>;

  private constructor(opts: { values: Array<T> | Set<T> }) {
    this.schemeSet = new Set([...(opts?.values ?? [])]);
  }

  static fromValues<T>(opts: { values: Array<T> | Set<T> }) {
    return new ConstantValidator(opts);
  }

  isValid(input: T) {
    return this.schemeSet.has(input);
  }
}

export class Formatters {
  static readonly DATE_TIME_1 = 'YYYY-MM-DD HH:mm:ss';
  static readonly DATE_TIME_2 = 'YYYYMMDDHHmmss';
  static readonly DATE_TIME_3 = 'YYYY-MM-DD HH:mm:ss.SSS';
  static readonly DATE_TIME_4 = 'YYYYMMDDHHmmssSSS';

  static readonly DATE_1 = 'YYYY-MM-DD';
  static readonly DATE_2 = 'YYYYMMDD';

  static readonly TIME_1 = 'HH:mm:ss';
  static readonly TIME_2 = 'HHmmssSSS';

  static readonly YEAR_MONTH_1 = 'YYYY-MM';
  static readonly YEAR_MONTH_2 = 'YYYYMM';
}

export class ApplicationRoles {
  static readonly API = 'api';
}

export class ResultCodes {
  static readonly RS_FAIL = 0;
  static readonly RS_SUCCESS = 1;
  static readonly RS_UNKNOWN_ERROR = -199;

  // 2xx successful – the request was successfully received, understood, and accepted
  static readonly RS_2 = {
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
  };

  // 4xx client error – the request contains bad syntax or cannot be fulfilled
  static readonly RS_4 = {
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    RequestTimeout: 408,
    UnsupportedMediaType: 415,
    UnprocessableEntity: 422,
  };

  // 5xx server error – the server failed to fulfil an apparently valid request
  static readonly RS_5 = {
    InternalServerError: 500,
    NotImplemented: 501,
  };
}

export class Sorts {
  static readonly DESC = 'desc';
  static readonly ASC = 'asc';
}

export class ApplicationRunModes {
  static readonly MODE_START_UP = 'startup';
  static readonly MODE_MIGRATE = 'migrate';
  static readonly MODE_SEED = 'seed';
}

export class EntityRelations {
  static readonly BELONGS_TO = 'belongsTo';
  static readonly HAS_ONE = 'hasOne';
  static readonly HAS_MANY = 'hasMany';
  static readonly HAS_MANY_THROUGH = 'hasManyThrough';
  static readonly HAS_MANY_POLYMORPHIC = 'hasManyPolymorphic';

  static readonly SCHEME_SET = new Set([
    this.BELONGS_TO,
    this.HAS_ONE,
    this.HAS_MANY,
    this.HAS_MANY_THROUGH,
    this.HAS_MANY_POLYMORPHIC,
  ]);

  static isValid(type: string) {
    return this.SCHEME_SET.has(type);
  }
}

export class ConfigurationDataTypes {
  static readonly NUMBER = 'NUMBER';
  static readonly TEXT = 'TEXT';
  static readonly BYTE = 'BYTE';
  static readonly JSON = 'JSON';
  static readonly BOOLEAN = 'BOOLEAN';

  static readonly SCHEME_SET = new Set([
    this.NUMBER,
    this.TEXT,
    this.BYTE,
    this.JSON,
    this.BOOLEAN,
  ]);

  static isValid(orgType: string): boolean {
    return this.SCHEME_SET.has(orgType);
  }
}

export class UserTypes {
  static readonly SYSTEM = 'SYSTEM';
  static readonly LINKED = 'LINKED';

  static readonly SCHEME_SET = new Set([this.SYSTEM, this.LINKED]);

  static isValid(orgType: string): boolean {
    return this.SCHEME_SET.has(orgType);
  }
}

export class MimeTypes {
  static readonly UNKNOWN = 'unknown';
  static readonly IMAGE = 'image';
  static readonly VIDEO = 'video';
  static readonly TEXT = 'text';
}
