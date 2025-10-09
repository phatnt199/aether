import { BaseService } from '@/base/services';
import { HttpErrors } from '@loopback/rest';

export class BasicTokenService extends BaseService {
  constructor() {
    super({ scope: BasicTokenService.name });
  }

  async verify(credential: { username: string; password: string }): Promise<any> {
    if (!credential) {
      this.logger.error('verify', 'Missing basic credential for validating request!');
      throw new HttpErrors.Unauthorized('Invalid basic request credential!');
    }

    let tokenPayload;
    try {
      const { username, password } = credential;
      const basicCredential = {
        identifier: { scheme: 'username', value: username },
        credential: { scheme: 'basic', value: password },
      };

      tokenPayload = basicCredential;
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error verifying token : ${error.message}`);
    }

    return tokenPayload;
  }
}
