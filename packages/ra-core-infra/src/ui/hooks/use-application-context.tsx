import React from 'react';

import { getError } from '@/utilities';
import { ApplicationContext } from '../context';

export const useApplicationContext = () => {
  const rs = React.useContext(ApplicationContext);

  if (!rs?.container) {
    throw getError({
      message: '[useApplicationContext] must be used within a ApplicationContextProvider',
    });
  }

  return rs.container;
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
