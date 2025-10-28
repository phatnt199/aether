export class ConstantValidator<T> {
  private schemeSet: Set<T>;

  private constructor(opts: { values: Array<T> | Set<T> }) {
    this.schemeSet = new Set([...(opts?.values ?? [])]);
  }

  static fromValues<T>(opts: { values: Array<T> | Set<T> }) {
    return new ConstantValidator(opts);
  }

  isValid(input: T) {
    return this.schemeSet.has(input);
  }
}

export class ConfigurationDataTypes {
  static readonly NUMBER = 'NUMBER';
  static readonly TEXT = 'TEXT';
  static readonly BYTE = 'BYTE';
  static readonly JSON = 'JSON';
  static readonly BOOLEAN = 'BOOLEAN';

  static readonly SCHEME_SET = new Set([
    this.NUMBER,
    this.TEXT,
    this.BYTE,
    this.JSON,
    this.BOOLEAN,
  ]);

  static isValid(orgType: string): boolean {
    return this.SCHEME_SET.has(orgType);
  }
}
