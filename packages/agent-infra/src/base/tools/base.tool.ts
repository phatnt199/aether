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

  abstract getTools(): TAgentToolRegistry;

  protected abstract buildTools(): TAgentToolRegistry;
}

export abstract class BaseAgentTool extends AbstractAgentTool {
  constructor(opts: { scope: string }) {
    super(opts);
    this.registry = this.buildTools();
  }

  getTools(): TAgentToolRegistry {
    return this.registry;
  }
}
