import React from 'react';

export interface IUseConfirmReturn {
  message?: string;
  confirm: (opts: { message: string }) => Promise<boolean>;
  handleClose: () => void;
  handleConfirm: () => void;
  handleAbort: () => void;
}

export const useConfirm = (): IUseConfirmReturn => {
  //--------------------------------------------------
  const [resolve, setResolve] = React.useState<(value: boolean) => void>();

  //--------------------------------------------------
  const [message, setMessage] = React.useState<string>();

  //--------------------------------------------------
  const confirm = React.useCallback((opts: { message: string }) => {
    return new Promise<boolean>(_resolve => {
      setResolve(() => {
        return (value: boolean) => {
          return _resolve(value);
        };
      });
      setMessage(opts.message);
    });
  }, []);

  //--------------------------------------------------
  const handleClose = React.useCallback(() => {
    setResolve(undefined);
    setMessage(undefined);
  }, []);

  //--------------------------------------------------
  const handleConfirm = React.useCallback(() => {
    resolve?.(true);
    handleClose();
  }, [handleClose, resolve]);

  //--------------------------------------------------
  const handleAbort = React.useCallback(() => {
    resolve?.(false);
    handleClose();
  }, [handleClose, resolve]);

  return { message, confirm, handleClose, handleConfirm, handleAbort };
};
