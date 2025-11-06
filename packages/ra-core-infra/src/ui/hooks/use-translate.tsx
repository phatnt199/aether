import React from 'react';

import { useI18nProvider } from 'ra-core';

import { AnyType, englishMessages, TFullPaths } from '@/common';

export interface IUseTranslateKeysOverrides {}

export type TUseTranslateKeysDefault = TFullPaths<typeof englishMessages>;

export type TUseTranslateKeys =
  | TUseTranslateKeysDefault
  | keyof IUseTranslateKeysOverrides;

export const useTranslate = () => {
  // --------------------------------------------------
  const i18nProvider = useI18nProvider();

  // --------------------------------------------------
  const translate = React.useCallback(
    (key: TUseTranslateKeys, options?: any) => {
      return i18nProvider.translate(key, options) as string;
    },
    [i18nProvider],
  );

  return i18nProvider ? translate : identity;
};

const identity = (key: AnyType) => key;
