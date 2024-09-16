import { AnyObject, ClassType, IdType } from '@/common';
import { model, property } from '@loopback/repository';
import { UserProfile } from '@loopback/security';

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IJWTTokenPayload extends UserProfile {
  userId: IdType;
  roles: { id: IdType; identifier: string; priority: number }[];
  clientId?: string;
}

export interface ITokenPayload extends IJWTTokenPayload {}

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
  name: 'OAuth2Request',
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
export class OAuth2Request {
  @property({ type: 'string' })
  clientId: string;

  @property({ type: 'string' })
  clientSecret: string;

  @property({ type: 'string' })
  redirectUrl: string;
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
  signIn(opts: SIRQ): Promise<SIRS>;
  signUp(opts: SURQ): Promise<SURS>;
  changePassword(opts: CPRQ): Promise<CPRS>;
  getUserInformation?(opts: UIRQ): Promise<UIRS>;
}
