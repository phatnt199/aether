import { ValueOrPromise } from '@/common';
import { AES, TestCaseDecisions, TestCaseHandler, TTestCaseDecision } from '@/helpers';
import { getError } from '@/utilities';

interface IArg {
  secretKey: string;
  message: string;
}

export class TestAES001Handler extends TestCaseHandler<{}, IArg> {
  execute() {
    if (!this.args) {
      throw getError({
        message: '[Test001Handler][execute] Invalid input args!',
      });
    }

    const { secretKey, message } = this.args;
    const aes = AES.withAlgorithm('aes-256-cbc');

    const encrypted = aes.encrypt(message, secretKey);
    console.log('[execute] encrypted message: %s', encrypted);

    const decrypted = aes.decrypt(encrypted, secretKey);
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
