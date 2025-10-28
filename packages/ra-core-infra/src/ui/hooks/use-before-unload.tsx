import React from 'react';

export interface IUseBeforeUnloadParams {
  enabled: boolean | (() => boolean);
  message?: string;
}

export const useBeforeUnload = (params: IUseBeforeUnloadParams) => {
  const { enabled, message } = params;

  //---------------------------------------------------------------------------
  const handleBeforeUnload = React.useCallback(
    (event: BeforeUnloadEvent) => {
      const isEnabled = enabled instanceof Function ? enabled() : enabled;
      if (!isEnabled) {
        return;
      }

      event.preventDefault();

      if (message) {
        event.returnValue = message;
      }

      return message;
    },
    [enabled, message],
  );

  //---------------------------------------------------------------------------
  React.useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleBeforeUnload]);
};
