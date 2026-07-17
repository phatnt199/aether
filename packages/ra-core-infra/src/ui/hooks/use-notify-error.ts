import React from 'react';

import { type ApplicationError } from '@venizia/ignis-inversion';
import type { NotificationOptions, NotificationType } from 'ra-core';
import { useNotify } from 'ra-core';

export const useNotifyError = () => {
  // --------------------------------------------------
  const notify = useNotify();

  // --------------------------------------------------
  return React.useCallback(
    (
      error: ApplicationError,
      options?: NotificationOptions & {
        type?: NotificationType;
      },
    ) => {
      notify(error?.messageCode, {
        type: 'error',
        messageArgs: error?.extra?.messageArgs,
        ...options,
      });
    },
    [notify],
  );
};
