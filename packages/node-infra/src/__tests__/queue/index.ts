import { TestCase, TestDescribe, TestPlan } from '@/helpers';
import * as TestCases from './test-cases';
import { getUID } from '@/utilities';

TestDescribe.withTestPlan({
  testPlan: TestPlan.newInstance({
    scope: '100_QUEUE',
    hooks: {},
    testCaseResolver: ({ context }) => {
      return [
        TestCase.withOptions({
          code: getUID(),
          description: 'Check queue',
          expectation: 'Queue work well',
          handler: new TestCases.TestQueue001Handler({
            context,
            args: {},
          }),
        }),
      ];
    },
  }),
}).run();
