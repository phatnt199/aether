import { ApplicationLogger, LoggerFactory } from '@/helpers/logger';
import { getError, int } from '@/utilities';
import { DEFAULT_CIPHER_BITS, DEFAULT_PAD_END, ICryptoAlgorithm } from '../common';

export abstract class AbstractCryptoAlgorithm<AL extends string, IO> implements ICryptoAlgorithm<AL, IO> {
  algorithm: AL;

  abstract encrypt(message: string, secret: string, opts?: IO | undefined): string;
  abstract decrypt(message: string, secret: string, opts?: IO | undefined): string;
}

export abstract class BaseCryptoAlgorithm<AL extends string, IO> extends AbstractCryptoAlgorithm<AL, IO> {
  protected logger: ApplicationLogger;

  constructor(opts: { scope: string; algorithm: AL }) {
    super();
    this.validateAlgorithmName({ algorithm: opts.algorithm });

    this.algorithm = opts.algorithm;
    this.logger = LoggerFactory.getLogger([opts.scope ?? opts.algorithm ?? BaseCryptoAlgorithm.name]);
  }

  validateAlgorithmName(opts: { algorithm: AL }) {
    const { algorithm } = opts;

    if (!algorithm) {
      throw getError({
        message: `[validateAlgorithmName] Invalid algorithm name | algorithm: ${algorithm}`,
      });
    }
  }

  normalizeSecretKey(opts: { secret: string; length: number; padEnd?: string }) {
    const { secret, length, padEnd = DEFAULT_PAD_END } = opts;

    if (secret.length > length) {
      return secret.slice(0, length);
    }

    return secret.padEnd(length, padEnd);
  }

  getAlgorithmKeySize() {
    const b = int(this.algorithm?.split('-')?.[1] ?? DEFAULT_CIPHER_BITS);
    return int(b / 8);
  }
}
