import { IError } from './types';

export class ApplicationError extends Error {
  statusCode: number;
  messageCode?: string;

  constructor(opts: IError) {
    const { message, messageCode, statusCode = 400 } = opts;
    super(message);

    this.statusCode = statusCode;
    this.messageCode = messageCode;
  }

  static getError(opts: IError) {
    return new ApplicationError(opts);
  }
}

export const getError = (opts: IError) => {
  return new ApplicationError(opts);
};
