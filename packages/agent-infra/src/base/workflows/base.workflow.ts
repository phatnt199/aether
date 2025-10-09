import { BaseHelper } from '@minimaltech/node-infra';

export abstract class AbstractWorkflow extends BaseHelper {
  constructor(opts: { scope: string }) {
    super(opts);
  }
}

export class BaseWorkflow extends AbstractWorkflow {}
