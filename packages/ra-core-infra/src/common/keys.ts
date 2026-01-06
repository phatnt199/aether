export class CoreBindings {
  static readonly APPLICATION_INSTANCE = '@app/application/instance';
  static readonly APPLICATION_INFO = '@app/application/info';

  static readonly DEFAULT_AUTH_PROVIDER = '@app/application/auth/default';
  static readonly DEFAULT_I18N_PROVIDER = '@app/application/i18n/default';
  static readonly DEFAULT_REST_DATA_PROVIDER = '@app/application/data/rest/default';

  static readonly AUTH_PROVIDER_OPTIONS = '@app/application/options/auth';
  static readonly DEFAULT_AUTH_SERVICE = '@app/application/service/auth/default';

  static readonly REST_DATA_PROVIDER_OPTIONS = '@app/application/options/rest/data';

  static readonly I18N_PROVIDER_OPTIONS = '@app/application/options/i18n';
}

export class LocalStorageKeys {
  static readonly KEY_AUTH_TOKEN = '@app/auth/token';
  static readonly KEY_AUTH_IDENTITY = '@app/auth/identity';
  static readonly KEY_AUTH_PERMISSION = '@app/auth/permission';
}
