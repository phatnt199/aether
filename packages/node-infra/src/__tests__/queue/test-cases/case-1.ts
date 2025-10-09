import { ValueOrPromise } from '@/common';
import { QueueHelper, TestCaseDecisions, TestCaseHandler, TTestCaseDecision } from '@/helpers';
import { getError, sleep } from '@/utilities';

interface IArg {}

export class TestQueue001Handler extends TestCaseHandler<{}, IArg> {
  async execute() {
    if (!this.args) {
      throw getError({
        message: '[Test001Handler][execute] Invalid input args!',
      });
    }

    const internalQueue = new QueueHelper<{ date: string }>({
      identifier: 'TEST_QUEUE',
      onMessage: async opts => {
        const { queueElement } = opts;
        await sleep(5);
        console.log(
          '[onMessage] queueElement: %s | currentState: %s | totalEvent: %s | processingEvents: %s',
          queueElement,
          internalQueue.getState(),
          internalQueue.getTotalEvent(),
          internalQueue.getProcessingEvents(),
        );
      },
      onDataEnqueue: () => {
        console.log(
          '[onDataEnqueue] currentState: %s | storage: %s | totalEvent: %s | processingEvents: %s',
          internalQueue.getState(),
          internalQueue.storage.length,
          internalQueue.getTotalEvent(),
          [...internalQueue.getProcessingEvents()],
        );
      },
      onDataDequeue: () => {
        console.log(
          '[onDataDequeue] currentState: %s | storage: %s | totalEvent: %s | processingEvents: %s',
          internalQueue.getState(),
          internalQueue.storage.length,
          internalQueue.getTotalEvent(),
          [...internalQueue.getProcessingEvents()],
        );
      },
    });

    let counter = 0;
    while (counter < 15) {
      await internalQueue.enqueue({ date: new Date().toLocaleString() });
      await sleep(20);
      counter++;
    }

    return internalQueue;
  }

  getValidator():
    | ((opts: Awaited<ReturnType<typeof this.execute>>) => ValueOrPromise<TTestCaseDecision>)
    | null {
    return () => {
      return TestCaseDecisions.SUCCESS;
    };
  }
}
