import { Component } from '@loopback/core';
import { LoggerFactory, ApplicationLogger } from '@/helpers';

export class BaseComponent implements Component {
  protected logger: ApplicationLogger;

  constructor(opts: { scope: string }) {
    this.logger = LoggerFactory.getLogger([opts?.scope ?? BaseComponent.name]);
  }
}
