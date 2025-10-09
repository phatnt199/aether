import { TestCase, TestDescribe, TestPlan } from '@/helpers';
import * as TestCases from './test-cases';
import { getUID } from '@/utilities';

TestDescribe.withTestPlan({
  testPlan: TestPlan.newInstance({
    scope: '003_REDIS',
    hooks: {},
    testCaseResolver: ({ context }) => {
      return [
        TestCase.withOptions({
          code: getUID(),
          description: 'Check initialize Redis Cluster',
          expectation:
            'Network TCP Server/Client successfully init and Client be able to connect to Server',
          handler: new TestCases.TestRedis001Handler({
            context,
            args: {
              nodes: [
                { host: '127.0.0.1', port: 1001 },
                { host: '127.0.0.1', port: 1002 },
                { host: '127.0.0.1', port: 1003 },
              ],
            },
          }),
        }),
      ];
    },
  }),
}).run();
