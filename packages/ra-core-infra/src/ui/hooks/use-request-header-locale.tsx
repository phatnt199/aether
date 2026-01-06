import React from 'react';

import { useLocaleState } from 'ra-core';

import { DefaultRestDataProvider } from '@/base/providers/default-rest-data.provider';
import { HeaderConsts } from '@/common/constants';
import { CoreBindings } from '@/common/keys';
import { useInjectable } from './use-injectable';

/**
 * @description A hook to set the request header locale for the DefaultRestDataProvider.
 */
export const useRequestHeaderLocale = (params?: { key?: string }) => {
  const key = params?.key || HeaderConsts.X_LOCALE;

  // --------------------------------------------------
  const [locale] = useLocaleState();

  // --------------------------------------------------
  const defaultRestDataProvider = useInjectable<DefaultRestDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  // --------------------------------------------------
  React.useEffect(() => {
    defaultRestDataProvider.getNetworkService().setHeaders({ [key]: locale });

    return () => {};
  }, [defaultRestDataProvider, key, locale]);
};
