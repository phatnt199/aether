import { createTool } from '@mastra/core';
import { BaseHelper } from '@minimaltech/node-infra';

export type TAgentTool = ReturnType<typeof createTool>;
export type TAgentToolRegistry = Record<string | symbol, TAgentTool>;

export interface IAgentTool {
  registry: TAgentToolRegistry;

  getTools(): TAgentToolRegistry;
}

export abstract class AbstractAgentTool extends BaseHelper implements IAgentTool {
  registry: TAgentToolRegistry;

  constructor(opts: { scope: string }) {
    super(opts);
    this.registry = this.buildTools();
  }

  abstract getTools(): TAgentToolRegistry;

  protected abstract buildTools(): TAgentToolRegistry;
}

export abstract class BaseAgentTool extends AbstractAgentTool {
  getTools(): TAgentToolRegistry {
    return this.registry;
  }
}
