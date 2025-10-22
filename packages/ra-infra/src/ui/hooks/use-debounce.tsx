import { App } from '@/common/constants';
import { isBrowser } from '@/utilities/boolean.utility';
import React from 'react';

export interface IUseDebounceParams<TValue> {
  value: TValue;
  delay?: number;
  disabled?: boolean;
}

export interface IUseDebounceReturn<TValue> {
  debouncedValue: TValue;
}

export const useDebounce = <TValue,>(
  params: IUseDebounceParams<TValue>,
): IUseDebounceReturn<TValue> => {
  const { value, delay, disabled } = params;

  //---------------------------------------------------------------------------
  const [debouncedValue, setDebouncedValue] = React.useState<TValue>(value);

  //---------------------------------------------------------------------------
  React.useEffect(() => {
    if (!isBrowser() || disabled) {
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay || App.DEFAULT_DEBOUNCE_TIME);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, disabled]);

  return { debouncedValue };
};
