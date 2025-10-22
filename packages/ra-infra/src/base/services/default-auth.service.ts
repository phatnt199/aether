import { LocalStorageKeys } from '@/common';

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
    userId: number;
    username: string;
    token: { value: string; type: string };
  }) {
    const { token, userId, username } = opts;
    localStorage.setItem(LocalStorageKeys.KEY_AUTH_TOKEN, JSON.stringify(token));
    localStorage.setItem(
      LocalStorageKeys.KEY_AUTH_IDENTITY,
      JSON.stringify({ userId, username }),
    );
  }

  cleanUp() {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('@app/auth/')) {
        return;
      }

      localStorage.removeItem(key);
    });
  }
}
