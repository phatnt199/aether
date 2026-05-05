export class ApplicationError extends Error {
  statusCode: number;
  messageCode?: string;
  payload?: any;

  extra?: {
    /**
     * @desc An optional field to provide arguments for the message code, which can be used for internationalization or detailed error messages.
     */
    messageArgs?: any;
    [key: string]: any;
  };

  constructor(opts: {
    statusCode?: number;
    messageCode?: string;
    message: string;
    payload?: any;
    extra?: {
      messageArgs?: any;
      [key: string]: any;
    };
  }) {
    const { message, messageCode, statusCode = 400, payload, extra } = opts;
    super(message);

    this.statusCode = statusCode;
    this.messageCode = messageCode;
    this.payload = payload;
    this.extra = extra;
  }
}

export const getError = (opts: {
  statusCode?: number;
  messageCode?: string;
  message: string;
  payload?: any;
  extra?: {
    messageArgs?: any;
    [key: string]: any;
  };
}) => {
  const error = new ApplicationError(opts);
  return error;
};

export const getClientError = (e: unknown) => {
  if (e instanceof ApplicationError) {
    return new ApplicationError({
      statusCode: e.statusCode,
      messageCode: e?.messageCode ?? e.message,
      message: e.message,
      extra: e.extra,
    });
  }

  if (e instanceof Error) {
    return new ApplicationError({
      messageCode: e.message,
      message: e.message,
    });
  }

  return new ApplicationError({
    messageCode: `${e}`,
    message: `${e}`,
  });
};
