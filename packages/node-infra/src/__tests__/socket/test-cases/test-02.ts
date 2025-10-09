import { ValueOrPromise } from '@/common';
import {
  NetworkTlsTcpClient,
  TestCaseDecisions,
  TestCaseHandler,
  TTestCaseDecision,
} from '@/helpers';
import { getError, sleep } from '@/utilities';

interface IArg {
  host: string;
  port: number;
}

export class TestSocket002Handler extends TestCaseHandler<{}, IArg> {
  async execute() {
    if (!this.args) {
      throw getError({
        message: '[TestSocket001Handler][execute] Invalid input args!',
      });
    }

    const { host, port } = this.args;

    const client = NetworkTlsTcpClient.newInstance({
      identifier: 'TLS_TEST_CLIENT_002',
      options: {
        host,
        port,
        rejectUnauthorized: true,
        minVersion: 'TLSv1.3',
        checkServerIdentity: (hostname, cert) => {
          console.log(hostname, cert);
          /* if (hostname !== host) {
            throw getError({
              message: `[initializeClient] Invalid TCP HOSTNAME | hostname: ${hostname} | valid: ${host}`,
            });
          }

          if (cert?.issuer?.CN !== 'Minimal Technology') {
            throw getError({
              message: `[initializeClient] Invalid ISSUER | cn: ${cert?.issuer?.CN} | valid: Minimal Technology`,
            });
          } */

          return undefined;
        },
      },
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

    return { client };
  }

  getValidator():
    | ((opts: Awaited<ReturnType<typeof this.execute>>) => ValueOrPromise<TTestCaseDecision>)
    | null {
    return opts => {
      const { client } = opts;

      if (!client) {
        return TestCaseDecisions.FAIL;
      }

      return TestCaseDecisions.SUCCESS;
    };
  }
}
