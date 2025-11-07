export class ApplicationError extends Error {
  statusCode: number;
  messageCode?: string;
  payload?: any;

  constructor(opts: { statusCode?: number; messageCode?: string; message: string; payload?: any }) {
    const { message, messageCode, statusCode = 400, payload } = opts;
    super(message);

    this.statusCode = statusCode;
    this.messageCode = messageCode;
    this.payload = payload;
  }
}

export const getError = (opts: {
  statusCode?: number;
  messageCode?: string;
  message: string;
  payload?: any;
}) => {
  const error = new ApplicationError(opts);
  return error;
};

export const getClientError = (e: unknown) => {
  if (e instanceof ApplicationError) {
    return new ApplicationError({
      messageCode: e?.messageCode ?? e.message,
      message: e.message,
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
