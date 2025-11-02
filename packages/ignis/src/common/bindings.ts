export class BindingKeys {
  static readonly APPLICATION_ENVIRONMENTS = Symbol.for('@app/application/environments');
  static readonly APPLICATION_MIDDLEWARE_OPTIONS = Symbol.for(
    '@app/application/middleware_options',
  );
  static readonly APPLICATION_INSTANCE = Symbol.for('@app/application/instance');
  static readonly APPLICATION_CONFIG = Symbol.for('@app/application/config');

  static readonly SEQUENCE_HANDLER = Symbol.for('@app/sequence/handler');

  // Security
  static readonly AUTHENTICATION_STRATEGY = Symbol.for('@app/auth/strategy');
  static readonly CURRENT_USER = Symbol.for('@app/auth/current-user');
  static readonly TOKEN_SERVICE = Symbol.for('@app/auth/token-service');
  static readonly USER_SERVICE = Symbol.for('@app/auth/user-service');

  // Request Context
  static readonly REQUEST_CONTEXT = Symbol.for('@app/request/context');
  static readonly HTTP_REQUEST = Symbol.for('@app/http/request');
  static readonly HTTP_RESPONSE = Symbol.for('@app/http/response');
}

export class SecurityBindings {
  static readonly USER = Symbol.for('@security/user');
}

export class CoreBindings {
  static readonly APPLICATION_INSTANCE = BindingKeys.APPLICATION_INSTANCE;
  static readonly APPLICATION_CONFIG = BindingKeys.APPLICATION_CONFIG;
}
