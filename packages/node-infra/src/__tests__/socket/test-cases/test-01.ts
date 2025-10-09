import { ValueOrPromise } from '@/common';
import {
  NetworkTcpClient,
  NetworkTcpServer,
  TestCaseDecisions,
  TestCaseHandler,
  TTestCaseDecision,
} from '@/helpers';
import { getError, sleep } from '@/utilities';

interface IArg {
  host: string;
  port: number;
}

export class TestSocket001Handler extends TestCaseHandler<{}, IArg> {
  async execute() {
    if (!this.args) {
      throw getError({
        message: '[TestSocket001Handler][execute] Invalid input args!',
      });
    }

    const { host, port } = this.args;

    const server = NetworkTcpServer.newInstance({
      identifier: 'TEST_SERVER_001',
      listenOptions: { host, port },
      serverOptions: {},
      authenticateOptions: { required: false },
    });

    await sleep(2000);
    const client = NetworkTcpClient.newInstance({
      identifier: 'TEST_CLIENT_001',
      options: { host, port },
      encoding: 'utf8',
      onData: (opts: { identifier: string; message: any }) => {
        this.logger.info('[client][onData] Opts: %j', opts);
      },
      onConnected: () => {
        this.logger.info('[client][onConnected] ');

        setInterval(() => {
          client.emit({ payload: new Date().toISOString() });
        }, 200);
      },
      onClosed: () => {
        this.logger.info('[client][onClosed] ');
      },
      onError: error => {
        this.logger.info('[client][onError] Error: %s', error);
      },
      reconnect: true,
    });

    client.connect({ resetReconnectCounter: true });

    let counter = 0;
    while (counter < 50) {
      await sleep(200);
      counter++;

      if (counter > 15) {
        client.disconnect();
      }
    }

    return { server, client };
  }

  getValidator():
    | ((opts: Awaited<ReturnType<typeof this.execute>>) => ValueOrPromise<TTestCaseDecision>)
    | null {
    return opts => {
      const { server, client } = opts;

      if (!server || !client) {
        return TestCaseDecisions.FAIL;
      }

      return TestCaseDecisions.SUCCESS;
    };
  }
}
