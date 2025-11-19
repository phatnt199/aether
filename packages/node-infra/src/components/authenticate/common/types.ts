import { AnyObject, ClassType, IdType, ValueOrPromise } from '@/common';
import { model, property } from '@loopback/repository';
import { RequestContext } from '@loopback/rest';
import { UserProfile } from '@loopback/security';

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IJWTTokenPayload extends UserProfile {
  userId: IdType;
  roles: { id: IdType; identifier: string; priority: number }[];
  clientId?: string;
  provider?: string;
}

export interface ITokenPayload extends IJWTTokenPayload {}

export type TGetTokenExpiresFn = () => ValueOrPromise<number>;

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IOAuth2User {
  id: IdType;
  [key: string]: any;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IAuthenticateTokenOptions {
  tokenSecret: string;
  tokenExpiresIn: number;
  refreshExpiresIn: number;
  refreshSecret: string;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IAuthenticateRestOptions<
  SIRQ extends SignInRequest = SignInRequest,
  SURQ extends SignUpRequest = SignUpRequest,
  CPRQ extends ChangePasswordRequest = ChangePasswordRequest,
> {
  restPath?: string;
  serviceKey?: string;
  requireAuthenticatedSignUp?: boolean;
  signInRequest?: ClassType<SIRQ>;
  signUpRequest?: ClassType<SURQ>;
  changePasswordRequest?: ClassType<CPRQ>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IAuthenticateOAuth2RestOptions {
  restPath?: string;
  tokenPath?: string;
  authorizePath?: string;
  oauth2ServiceKey?: string;
  useImplicitGrant?: boolean;
  userFetcher?: (userId: IdType) => Promise<IOAuth2User | null>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IAuthenticateOAuth2Options {
  enable: boolean;

  // TODO only authorization_code is supported at this moment
  handler: {
    type: 'authorization_code';
    authServiceKey: string;
  };

  restOptions?: IAuthenticateOAuth2RestOptions;
  viewFolder?: string;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
@model({
  name: 'SignInRequest',
  jsonSchema: {
    required: ['identifier', 'credential'],
    examples: [
      {
        identifier: { scheme: 'username', value: 'test_username' },
        credential: { scheme: 'basic', value: 'test_password' },
      },
      {
        clientId: 'mt-hrm',
        identifier: { scheme: 'username', value: 'test_username' },
        credential: { scheme: 'basic', value: 'test_password' },
      },
    ],
  },
})
export class SignInRequest {
  @property({
    type: 'object',
    jsonSchema: {
      properties: { scheme: { type: 'string' }, value: { type: 'string' } },
    },
  })
  identifier: { scheme: string; value: string };

  @property({
    type: 'object',
    jsonSchema: {
      properties: { scheme: { type: 'string' }, value: { type: 'string' } },
    },
  })
  credential: { scheme: string; value: string };

  @property({ type: 'string' })
  clientId?: string;
}

@model({
  name: 'ChangePasswordRequest',
  jsonSchema: {
    required: ['oldCredential', 'newCredential'],
    examples: [
      {
        oldCredential: { scheme: 'basic', value: 'old_password' },
        newCredential: { scheme: 'basic', value: 'new_password' },
      },
    ],
  },
})
export class ChangePasswordRequest {
  @property({
    type: 'object',
    jsonSchema: {
      properties: { scheme: { type: 'string' }, value: { type: 'string' } },
    },
  })
  oldCredential: { scheme: string; value: string };

  @property({
    type: 'object',
    jsonSchema: {
      properties: { scheme: { type: 'string' }, value: { type: 'string' } },
    },
  })
  newCredential: { scheme: string; value: string };

  userId: IdType;
}

// -------------------------------------------------------------------
@model({
  name: 'SignUpRequest',
  jsonSchema: {
    required: ['username'],
    examples: [{ username: 'example_username', credential: 'example_credential' }],
  },
})
export class SignUpRequest {
  @property({ type: 'string' })
  username: string;

  @property({ type: 'string' })
  credential: string;

  [additional: string | symbol]: any;
}

// -------------------------------------------------------------------
@model({
  name: 'OAuth2PathRequest',
  jsonSchema: {
    required: ['clientId', 'clientSecret', 'redirectUrl'],
    examples: [
      {
        clientId: 'example_id',
        clientSecret: 'example_secret',
        redirectUrl: 'example_redirect_url',
      },
    ],
  },
})
export class OAuth2PathRequest {
  @property({ type: 'string' })
  clientId: string;

  @property({ type: 'string' })
  clientSecret: string;

  @property({ type: 'string' })
  redirectUrl: string;
}

// -------------------------------------------------------------------
@model({
  name: 'OAuth2TokenRequest',
  jsonSchema: {
    required: ['clientId', 'clientSecret', 'authorizationCode', 'redirectUrl', 'grantType'],
    examples: [
      {
        clientId: 'example_id',
        clientSecret: 'example_secret',
        authorizationCode: 'example_code',
        redirectUrl: 'example_redirect_url',
        grantType: 'example_grant_type',
      },
    ],
  },
})
export class OAuth2AuthorizationCodeRequest {
  @property({ type: 'string' })
  clientId: string;

  @property({ type: 'string' })
  clientSecret: string;

  @property({ type: 'string' })
  authorizationCode: string;

  @property({ type: 'string' })
  redirectUrl: string;

  @property({ type: 'string' })
  grantType: string;
}

// -------------------------------------------------------------------
export interface IAuthService<
  // SignIn types
  SIRQ extends SignInRequest = SignInRequest,
  SIRS = AnyObject,
  // SignUp types
  SURQ extends SignUpRequest = SignUpRequest,
  SURS = AnyObject,
  // ChangePassword types
  CPRQ extends ChangePasswordRequest = ChangePasswordRequest,
  CPRS = AnyObject,
  // UserInformation types
  UIRQ = AnyObject,
  UIRS = AnyObject,
> {
  signIn(opts: SIRQ & { requestContext?: RequestContext }): Promise<SIRS>;
  signUp(opts: SURQ & { requestContext?: RequestContext }): Promise<SURS>;
  changePassword(opts: CPRQ & { requestContext?: RequestContext }): Promise<CPRS>;
  getUserInformation?(opts: UIRQ & { requestContext?: RequestContext }): Promise<UIRS>;
}
