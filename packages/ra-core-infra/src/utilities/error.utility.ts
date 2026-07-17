import { ApplicationError, getError } from '@venizia/ignis-inversion';

export const getClientError = (e: unknown) => {
  if (e instanceof ApplicationError) {
    return getError({
      statusCode: e.statusCode,
      message: e.normalized.text,
      messageCode: e.normalized.code,
      messageArgs: e.normalized.args,
      extra: e.extra,
    });
  }

  if (e instanceof Error) {
    return getError({ message: e.message });
  }

  return getError({ message: `${e}` });
};
