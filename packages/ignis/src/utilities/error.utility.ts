export class ApplicationError extends Error {
  statusCode: number;
  messageCode?: string;

  constructor(opts: { statusCode?: number; messageCode?: string; message: string }) {
    const { message, messageCode, statusCode = 400 } = opts;
    super(message);

    this.statusCode = statusCode;
    this.messageCode = messageCode;
  }
}

export const getError = (opts: { statusCode?: number; messageCode?: string; message: string }) => {
  const error = new ApplicationError(opts);
  return error;
};
