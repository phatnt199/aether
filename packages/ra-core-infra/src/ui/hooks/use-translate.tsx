import React from 'react';

import { useI18nProvider } from 'ra-core';

import { AnyType, englishMessages, TFullPaths } from '@/common';

export interface IUseTranslateKeysOverrides {}

export type TUseTranslateKeysDefault = TFullPaths<typeof englishMessages>;

export type TUseTranslateKeys = TUseTranslateKeysDefault | keyof IUseTranslateKeysOverrides;

export type TUseTranslateFn = (key: TUseTranslateKeys, options?: AnyType) => string;

export const useTranslate = () => {
  // --------------------------------------------------
  const i18nProvider = useI18nProvider();

  // --------------------------------------------------
  const translate: TUseTranslateFn = React.useCallback(
    (key: TUseTranslateKeys, options?: AnyType) => {
      return i18nProvider.translate(key, options) as string;
    },
    [i18nProvider],
  );

  return i18nProvider ? translate : identity;
};

const identity = (key: AnyType) => key;
