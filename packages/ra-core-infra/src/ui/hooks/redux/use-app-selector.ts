import isEqual from 'lodash/isEqual';
import { shallowEqual, useSelector } from 'react-redux';

export const createAppSelectors = <S>() => {
  // --------------------------------------------------
  const useAppSelector = useSelector.withTypes<S>();

  // --------------------------------------------------
  const useShallowEqualSelector = <T>(selector: (state: S) => T) => {
    return useAppSelector(selector, shallowEqual);
  };

  // --------------------------------------------------
  const useDeepEqualSelector = <T>(selector: (state: S) => T) => {
    return useAppSelector(selector, isEqual);
  };

  return {
    useAppSelector,
    useShallowEqualSelector,
    useDeepEqualSelector,
  };
};
