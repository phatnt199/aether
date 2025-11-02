export class App {
  static readonly ENV = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development';

  static readonly PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  static readonly HOST = process.env.HOST ?? 'localhost';

  static readonly DEFAULT_QUERY_LIMIT = 50;
  static readonly DEFAULT_QUERY_OFFSET = 0;

  static readonly DS_POSTGRES = 'postgresql';
  static readonly DS_MEMORY = 'memory';
  static readonly DS_REDIS = 'redis';
}

export class HttpHeaders {
  static readonly AUTHORIZATION = 'authorization';
  static readonly REQUEST_TRACING_ID = 'x-request-id';
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

export class HttpMethods {
  static readonly GET = 'GET';
  static readonly POST = 'POST';
  static readonly PUT = 'PUT';
  static readonly PATCH = 'PATCH';
  static readonly DELETE = 'DELETE';
  static readonly HEAD = 'HEAD';
  static readonly OPTIONS = 'OPTIONS';
}
