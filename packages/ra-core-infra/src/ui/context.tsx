import React from 'react';

import { type Container } from '@venizia/ignis-inversion';

import { type Logger } from '@/helpers';

export const ApplicationContext = React.createContext<{
  container: Container | null;
  registry: Container | null;
  logger: Logger | null;
}>({
  container: null,
  registry: null,
  logger: null,
});
