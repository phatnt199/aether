import { BaseService } from '@/base/base.service';
import { AES } from '@/helpers';
import { getError } from '@/utilities';
import { TokenServiceBindings } from '@loopback/authentication-jwt';
import { BindingScope, inject, injectable } from '@loopback/core';
import { HttpErrors } from '@loopback/rest';
import { securityId } from '@loopback/security';
import jwt from 'jsonwebtoken';
import { AuthenticateKeys, Authentication, IJWTTokenPayload } from '../common';

@injectable({ scope: BindingScope.SINGLETON })
export class JWTTokenService extends BaseService {
  private aes = AES.withAlgorithm('aes-256-cbc');

  constructor(
    @inject(AuthenticateKeys.APPLICATION_SECRET)
    private applicationSecret: string,
    @inject(TokenServiceBindings.TOKEN_SECRET) private jwtSecret: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN) private jwtExpiresIn: string,
  ) {
    super({ scope: JWTTokenService.name });
  }

  // --------------------------------------------------------------------------------------
  extractCredentials(request: { headers: any }): { type: string; token: string } {
    if (!request.headers.authorization) {
      throw getError({
        statusCode: 401,
        message: 'Unauthorized user! Missing authorization header',
      });
    }

    const authHeaderValue = request.headers.authorization;
    if (!authHeaderValue.startsWith(Authentication.TYPE_BEARER)) {
      throw getError({
        statusCode: 401,
        message: 'Unauthorized user! Invalid schema of request token!',
      });
    }

    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2) {
      throw new HttpErrors.Unauthorized(
        `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
      );
    }

    return { type: parts[0], token: parts[1] };
  }

  // --------------------------------------------------------------------------------------
  encryptPayload(payload: IJWTTokenPayload) {
    const userKey = this.aes.encrypt('userId', this.applicationSecret);

    const rolesKey = this.aes.encrypt('roles', this.applicationSecret);
    const clientIdKey = this.aes.encrypt('clientId', this.applicationSecret);

    const { userId, roles, clientId = 'NA' } = payload;

    return {
      [userKey]: this.aes.encrypt(userId.toString(), this.applicationSecret),
      [rolesKey]: this.aes.encrypt(
        JSON.stringify(roles.map(el => `${el.id}|${el.identifier}|${el.priority}`)),
        this.applicationSecret,
      ),
      [clientIdKey]: this.aes.encrypt(clientId, this.applicationSecret),
    };
  }

  // --------------------------------------------------------------------------------------
  decryptPayload(decodedToken: any): IJWTTokenPayload {
    const rs: any = {};

    const jwtFields = new Set<string>(['iat', 'exp']);

    for (const encodedAttr in decodedToken) {
      if (jwtFields.has(encodedAttr)) {
        rs[encodedAttr] = decodedToken[encodedAttr];
        continue;
      }

      const attr = this.aes.decrypt(encodedAttr, this.applicationSecret);
      const decryptedValue = this.aes.decrypt(decodedToken[encodedAttr], this.applicationSecret);

      switch (attr) {
        case 'userId': {
          rs.userId = parseInt(decryptedValue);
          rs[securityId] = rs.userId.toString();
          break;
        }
        case 'clientId': {
          rs.clientId = decryptedValue;
          break;
        }
        case 'roles': {
          rs.roles = (JSON.parse(decryptedValue) as string[]).map(el => {
            const [id, identifier, priority] = el.split('|');
            return { id, identifier, priority };
          });
          break;
        }
        default: {
          rs[encodedAttr] = decodedToken[encodedAttr];
          break;
        }
      }
    }

    return rs;
  }

  // --------------------------------------------------------------------------------------
  verify(opts: { type: string; token: string }): IJWTTokenPayload {
    const { token } = opts;
    if (!token) {
      this.logger.error('[verify] Missing token for validating request!');
      throw new HttpErrors.Unauthorized('Invalid request token!');
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error verifying token : ${error.message}`);
    }

    try {
      return this.decryptPayload(decodedToken);
    } catch (error) {
      this.logger.error('[verify] Failed to decode token | Error: %s', error);
      throw getError({
        statusCode: 401,
        message: 'Invalid token signature | Failed to decode token!',
      });
    }
  }

  // --------------------------------------------------------------------------------------
  generate(payload: IJWTTokenPayload): string {
    if (!payload) {
      throw new HttpErrors.Unauthorized('Error generating token : userProfile is null');
    }

    let token: string;
    try {
      token = jwt.sign(this.encryptPayload(payload), this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }
}
