export class ApplicationError extends Error {
  statusCode: number;
  messageCode?: string;
  payload?: any;
  /**
   * @desc An optional field to provide arguments for the message code, which can be used for internationalization or detailed error messages.
   */
  messageArgs?: any;

  constructor(opts: {
    statusCode?: number;
    messageCode?: string;
    message: string;
    payload?: any;
    messageArgs?: any;
  }) {
    const { message, messageCode, statusCode = 400, payload, messageArgs } = opts;
    super(message);

    this.statusCode = statusCode;
    this.messageCode = messageCode;
    this.payload = payload;
    this.messageArgs = messageArgs;
  }
}

export const getError = (opts: {
  statusCode?: number;
  messageCode?: string;
  message: string;
  payload?: any;
  messageArgs?: any;
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
      messageArgs: e.messageArgs,
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
