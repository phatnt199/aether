import React from 'react';

import { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

export const createAppDispatch = <
  D extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
>() => {
  // --------------------------------------------------
  const useAppDispatch = useDispatch.withTypes<D>();

  // --------------------------------------------------
  const useMultipleAppDispatch = () => {
    // --------------------------------------------------
    const dispatch = useAppDispatch();

    // --------------------------------------------------
    type DispatchActionType = Parameters<D>[0];

    // --------------------------------------------------
    const multipleDispatch = React.useCallback(
      (...actions: DispatchActionType[]) => {
        actions.forEach(action => {
          if (action) {
            dispatch(action);
          }
        });
      },
      [dispatch],
    );

    // --------------------------------------------------
    return multipleDispatch;
  };

  return {
    useAppDispatch,
    useMultipleAppDispatch,
  };
};
