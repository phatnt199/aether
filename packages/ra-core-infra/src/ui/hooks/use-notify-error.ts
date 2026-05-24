import React from 'react';

import { useNotify } from 'ra-core';
import type { NotificationOptions, NotificationType } from 'ra-core';

import { ApplicationError } from '@/utilities/error.utility';

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
