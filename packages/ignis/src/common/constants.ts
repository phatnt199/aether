export class App {
  static readonly ENV =
    process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";

  static readonly PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  static readonly HOST = process.env.HOST ?? "localhost";

  static readonly DEFAULT_QUERY_LIMIT = 50;
  static readonly DEFAULT_QUERY_OFFSET = 0;

  static readonly DS_POSTGRES = "postgresql";
  static readonly DS_MEMORY = "memory";
  static readonly DS_REDIS = "redis";
}

export class HttpHeaders {
  static readonly AUTHORIZATION = "authorization";
  static readonly REQUEST_TRACING_ID = "x-request-id";
}

export class HttpStatusCodes {
  static readonly OK = 200;
  static readonly CREATED = 201;
  static readonly ACCEPTED = 202;
  static readonly NO_CONTENT = 204;

  static readonly BAD_REQUEST = 400;
  static readonly UNAUTHORIZED = 401;
  static readonly FORBIDDEN = 403;
  static readonly NOT_FOUND = 404;
  static readonly CONFLICT = 409;
  static readonly UNPROCESSABLE_ENTITY = 422;

  static readonly INTERNAL_SERVER_ERROR = 500;
  static readonly NOT_IMPLEMENTED = 501;
  static readonly BAD_GATEWAY = 502;
  static readonly SERVICE_UNAVAILABLE = 503;
}

export class HttpMethods {
  static readonly GET = "GET";
  static readonly POST = "POST";
  static readonly PUT = "PUT";
  static readonly PATCH = "PATCH";
  static readonly DELETE = "DELETE";
  static readonly HEAD = "HEAD";
  static readonly OPTIONS = "OPTIONS";
}
