import { ValueOrPromise } from '@/common';
import { RSA, TestCaseDecisions, TestCaseHandler, TTestCaseDecision } from '@/helpers';
import { getError } from '@/utilities';

interface IArg {
  message: string;
}

export class TestRSA001Handler extends TestCaseHandler<{}, IArg> {
  execute() {
    if (!this.args) {
      throw getError({
        message: '[Test001Handler][execute] Invalid input args!',
      });
    }

    const { message } = this.args;
    const rsa = RSA.withAlgorithm();
    const keys = rsa.generateDERKeyPair();

    const encrypted = rsa.encrypt(message, keys.publicKey.toString('base64'));
    console.log('[execute] encrypted message: %s', encrypted);

    const decrypted = rsa.decrypt(encrypted, keys.privateKey.toString('base64'));
    console.log('[execute] decrypted message: %s', decrypted);

    return { encrypted, decrypted, message };
  }

  getValidator():
    | ((opts: Awaited<ReturnType<typeof this.execute>>) => ValueOrPromise<TTestCaseDecision>)
    | null {
    return opts => {
      const { message, encrypted, decrypted } = opts;

      if (!encrypted) {
        return TestCaseDecisions.FAIL;
      }

      if (message !== decrypted) {
        return TestCaseDecisions.FAIL;
      }

      return TestCaseDecisions.SUCCESS;
    };
  }
}
