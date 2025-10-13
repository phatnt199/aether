import { Agent } from '@mastra/core/agent';
import { BaseHelper } from '@minimaltech/node-infra';

export type TAgentOpts = ConstructorParameters<typeof Agent>[0] & { scope: string };

export class BaseAgent extends BaseHelper {
  protected agent: Agent;

  constructor(opts: TAgentOpts) {
    const { scope, ...agentOpts } = opts;
    super({ scope });
    this.agent = new Agent(agentOpts);
  }

  getAgent() {
    return this.agent;
  }
}
