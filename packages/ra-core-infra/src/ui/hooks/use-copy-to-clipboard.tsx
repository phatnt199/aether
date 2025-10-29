import React from 'react';

export interface IUseCopyToClipboardReturn {
  copy: (opts: { value: string }) => Promise<boolean>;
}

export const useCopyToClipboard = (): IUseCopyToClipboardReturn => {
  //-------------------------------------------------------------------
  const copy = React.useCallback(async (opts: { value: string }) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    const { value } = opts;

    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      return false;
    }
  }, []);

  return { copy };
};
