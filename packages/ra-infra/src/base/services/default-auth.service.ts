import { IdType, LocalStorageKeys } from '@/common';

export class DefaultAuthService {
  getUser() {
    return JSON.parse(localStorage.getItem(LocalStorageKeys.KEY_AUTH_IDENTITY) || '{}');
  }

  getRoles() {
    const roles = JSON.parse(
      localStorage.getItem(LocalStorageKeys.KEY_AUTH_PERMISSION) || '[]',
    );
    return new Set<string>(roles);
  }

  getAuth() {
    try {
      const encryptedToken = localStorage.getItem(LocalStorageKeys.KEY_AUTH_TOKEN) ?? '';
      return JSON.parse(encryptedToken);
    } catch (_error) {
      return null;
    }
  }

  saveAuth(opts: {
    userId: number | string;

    username?: string;
    provider?: string;
    referenceId?: IdType;

    token: { value: string; type: string };
  }) {
    const { token, userId, username = '', provider = '', referenceId = '' } = opts;
    localStorage.setItem(
      LocalStorageKeys.KEY_AUTH_TOKEN,
      JSON.stringify(Object.assign({}, token, { provider })),
    );
    localStorage.setItem(
      LocalStorageKeys.KEY_AUTH_IDENTITY,
      JSON.stringify({ userId, username, referenceId, provider }),
    );
  }

  cleanUp() {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('@app/auth/') && !key.startsWith('@app/oauth2/')) {
        return;
      }

      localStorage.removeItem(key);
    });
  }
}
