import React from 'react';

import { getError } from '@/utilities';
import { Context } from '@loopback/context';
import { ApplicationContext } from '../context';

export const useApplicationContext = () => {
  const rs = React.useContext(ApplicationContext);

  if (!rs?.context) {
    throw getError({
      message: '[useApplicationContext] must be used within a ApplicationContextProvider',
    });
  }

  return rs.context;
};

export const useApplicationLogger = () => {
  const rs = React.useContext(ApplicationContext);
  if (!rs?.logger) {
    throw getError({
      message: '[useApplicationLogger] must be used within a ApplicationContextProvider',
    });
  }

  return rs.logger;
};

/**
 * @deprecated Use `useInjectable` instead.
 */
export const useInjectableLegacy = <T,>(opts: { context?: Context; key: string }) => {
  const requestContext = opts?.context;
  const applicationContext = React.useContext(ApplicationContext);

  const context = requestContext ?? applicationContext.context;
  if (!context) {
    throw getError({
      message: '[useInjectable] Failed to determine injectable context!',
    });
  }

  return context.getSync<T>(opts.key);
};
