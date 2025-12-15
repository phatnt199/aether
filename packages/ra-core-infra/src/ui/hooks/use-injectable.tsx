import React from 'react';

import { Container } from '@venizia/ignis-inversion';

import { CoreBindings, ValueOf } from '@/common';
import { getError } from '@/utilities';
import { ApplicationContext } from '../context';

export interface IUseInjectableKeysOverrides {}

export type TUseInjectableKeysDefault = Extract<ValueOf<typeof CoreBindings>, string>;

export type TUseInjectableKeys = TUseInjectableKeysDefault | keyof IUseInjectableKeysOverrides;

export const useInjectable = <T,>(opts: { container?: Container; key: TUseInjectableKeys }) => {
  const requestContainer = opts?.container;
  const applicationContext = React.useContext(ApplicationContext);

  const container = requestContainer ?? applicationContext.container;
  if (!container) {
    throw getError({
      message: '[useInjectable] Failed to determine injectable container!',
    });
  }

  return container.get<T>({ key: opts.key });
};
