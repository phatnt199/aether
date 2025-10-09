export class Statuses {
  static readonly UNKNOWN = '000_UNKNOWN';
  static readonly ACTIVATED = '100_ACTIVATED';
  static readonly DEACTIVATED = '101_DEACTIVATED';
  static readonly BLOCKED = '102_BLOCKED';
  static readonly DRAFT = '103_DRAFT';
  static readonly ARCHIVE = '104_ARCHIVE';
  static readonly SUCCESS = '105_SUCCESS';
  static readonly FAIL = '106_FAIL';
  static readonly SENT = '107_SENT';
}

export class MigrationStatuses {
  static readonly UNKNOWN = Statuses.UNKNOWN;
  static readonly SUCCESS = Statuses.SUCCESS;
  static readonly FAIL = Statuses.FAIL;
}

export class CommonStatuses {
  static readonly UNKNOWN = Statuses.UNKNOWN;
  static readonly ACTIVATED = Statuses.ACTIVATED;
  static readonly DEACTIVATED = Statuses.DEACTIVATED;
  static readonly BLOCKED = Statuses.BLOCKED;
  static readonly ARCHIVE = Statuses.ARCHIVE;

  static readonly SCHEME_SET = new Set([
    this.UNKNOWN,
    this.ACTIVATED,
    this.DEACTIVATED,
    this.BLOCKED,
    this.ARCHIVE,
  ]);

  static isValid(scheme: string): boolean {
    return this.SCHEME_SET.has(scheme);
  }
}

export class UserStatuses extends CommonStatuses {}

export class RoleStatuses extends CommonStatuses {}

export class OAuth2TokenStatuses {
  static readonly UNKNOWN = Statuses.UNKNOWN;
  static readonly ACTIVATED = Statuses.ACTIVATED;
  static readonly DEACTIVATED = Statuses.DEACTIVATED;

  static readonly SCHEME_SET = new Set([this.ACTIVATED, this.DEACTIVATED]);

  static isValid(scheme: string): boolean {
    return this.SCHEME_SET.has(scheme);
  }
}
