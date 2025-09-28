import { ValueOrPromise } from '@/common';
import { TestCaseDecisions, TestCaseHandler, TTestCaseDecision } from '@/helpers';
import { getError } from '@/utilities';
import { Cluster } from 'ioredis';

interface IArg {
  nodes: Array<{ host: string; port: number }>;
}

export class TestRedis001Handler extends TestCaseHandler<{}, IArg> {
  async execute() {
    if (!this.args) {
      throw getError({
        message: '[Test001Handler][execute] Invalid input args!',
      });
    }

    const ioCluster = new Cluster(this.args.nodes, {
      redisOptions: { password: 'xxx' },
    });

    ioCluster.on('connect', async (...args) => {
      console.log('CONNECT', args);
      await ioCluster.set('a', 10);
      const rs = await ioCluster.get('a');
      console.log({ rs });
    });

    ioCluster.on('error', console.log);
    ioCluster.on('ready', () => {
      console.log('READY');
    });

    ioCluster.on('close', close => {
      console.log('close', close);
    });

    ioCluster.on('reconnecting', console.log);
  }

  getValidator():
    | ((opts: Awaited<ReturnType<typeof this.execute>>) => ValueOrPromise<TTestCaseDecision>)
    | null {
    return () => {
      return TestCaseDecisions.SUCCESS;
    };
  }
}
