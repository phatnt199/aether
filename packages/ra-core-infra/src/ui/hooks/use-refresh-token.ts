import React from 'react';

import type { IAuthProvider } from '@minimaltech/ra-core-infra';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthProvider } from 'ra-core';

/**
 * Get a callback for calling the authProvider.refreshToken() method.
 *
 * @see useRefreshToken
 *
 * @returns {Function} refreshToken callback
 *
 * @example
 *
 * import { useRefreshToken } from '@/hooks/use-refresh-token';
 *
 * const RefreshTokenButton = () => {
 *     const refreshToken = useRefreshToken();
 *     return <button onClick={() => refreshToken()}>Refresh token</button>;
 * };
 */
export const useRefreshToken = (): TRefreshToken => {
  // --------------------------------------------------
  const authProvider = useAuthProvider<IAuthProvider>();

  // --------------------------------------------------
  const queryClient = useQueryClient();

  // --------------------------------------------------
  const refreshToken = React.useCallback(() => {
    if (!authProvider) {
      return Promise.resolve();
    }

    return authProvider.refreshToken().then(ret => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'getPermissions'] });
      return ret;
    });
  }, [authProvider, queryClient]);

  return refreshToken;
};

type TRefreshToken = () => Promise<any>;
