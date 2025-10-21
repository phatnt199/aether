export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== undefined && value !== null;
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown, exact?: boolean): value is number => {
  if (exact) {
    return typeof value === 'number';
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }

  return !isNaN(parseFloat(String(value))) && isFinite(Number(value));
};

export const isObject = (value: any) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isBrowser = () => {
  return typeof window !== 'undefined';
};

export const isValidDate = (value: any) => {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.valueOf());
};
