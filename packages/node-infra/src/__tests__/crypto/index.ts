import { TestCase, TestDescribe, TestPlan } from '@/helpers';
import * as TestCases from './test-cases';
import { getUID } from '@/utilities';

TestDescribe.withTestPlan({
  testPlan: TestPlan.newInstance({
    scope: '000_CRYPTO',
    hooks: {},
    testCaseResolver: ({ context }) => {
      return [
        TestCase.withOptions({
          code: getUID(),
          description: 'Check AES message successfully encrypt and decrypt',
          expectation: 'AES en-decryption',
          handler: new TestCases.TestAES001Handler({
            context,
            args: { secretKey: 'abc123qwe', message: 'hello world' },
          }),
        }),
        TestCase.withOptions({
          code: getUID(),
          description: 'Check RSA message successfully encrypt and decrypt',
          expectation: 'RSA en-decryption',
          handler: new TestCases.TestRSA001Handler({
            context,
            args: {
              message: 'hello world | minimal technology',
            },
          }),
        }),
      ];
    },
  }),
}).run();
