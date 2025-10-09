import { ITestPlanOptions } from '../types';
import { BaseTestPlan } from './base';

export class TestPlan<R extends object> extends BaseTestPlan<R> {
  static newInstance<R extends object>(opts: ITestPlanOptions<R>) {
    return new TestPlan<R>(opts);
  }
}
