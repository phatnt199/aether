import { BaseProvider } from '@/base/base.provider';
import {
  MailQueueExecutorTypes,
  type IMailQueueExecutor,
  type IMailQueueExecutorConfig,
} from '@/components/mail';
import {
  BullMQMailExecutorHelper,
  DirectMailExecutorHelper,
  InternalQueueMailExecutorHelper,
} from '@/components/mail/helpers';
import { getError } from '@/utilities';
import { Provider, ValueOrPromise } from '@minimaltech/node-infra/lb-core';

export type TGetMailQueueExecutorFn = (config: IMailQueueExecutorConfig) => IMailQueueExecutor;

export class MailQueueExecutorProvider
  extends BaseProvider<TGetMailQueueExecutorFn>
  implements Provider<TGetMailQueueExecutorFn>
{
  constructor() {
    super({ scope: MailQueueExecutorProvider.name });
  }

  value(): ValueOrPromise<TGetMailQueueExecutorFn> {
    return (config: IMailQueueExecutorConfig) => {
      this.logger.info('[value] Creating mail queue executor of type: %s', config.type);
      switch (config.type) {
        case MailQueueExecutorTypes.DIRECT: {
          return new DirectMailExecutorHelper();
        }

        case MailQueueExecutorTypes.INTERNAL_QUEUE: {
          if (!config.internalQueue) {
            throw getError({ message: 'Internal queue configuration is missing' });
          }

          return new InternalQueueMailExecutorHelper({
            identifier: config.internalQueue.identifier,
          });
        }

        case MailQueueExecutorTypes.BULLMQ: {
          if (!config.bullmq) {
            throw getError({ message: 'BullMQ configuration is missing' });
          }

          return new BullMQMailExecutorHelper(config.bullmq);
        }

        default: {
          throw getError({ message: `Unknown mail queue executor type: ${config.type}` });
        }
      }
    };
  }
}
