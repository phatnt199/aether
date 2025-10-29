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
