import React from 'react';

import { Context } from '@loopback/context';

import { CoreBindings, ValueOf } from '@/common';
import { getError } from '@/utilities';
import { ApplicationContext } from '../context';

export interface IUseInjectableKeysOverrides {}

export type TUseInjectableKeysDefault = Extract<ValueOf<typeof CoreBindings>, string>;

export type TUseInjectableKeys = TUseInjectableKeysDefault | keyof IUseInjectableKeysOverrides;

export const useInjectable = <T,>(opts: { context?: Context; key: TUseInjectableKeys }) => {
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
