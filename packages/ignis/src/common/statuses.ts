export class EntityStatus {
  static readonly ACTIVE = "active";
  static readonly INACTIVE = "inactive";
  static readonly PENDING = "pending";
  static readonly DELETED = "deleted";
  static readonly ARCHIVED = "archived";

  static readonly ALL = [
    EntityStatus.ACTIVE,
    EntityStatus.INACTIVE,
    EntityStatus.PENDING,
    EntityStatus.DELETED,
    EntityStatus.ARCHIVED,
  ] as const;

  static isValid(status: string): boolean {
    return EntityStatus.ALL.includes(status as any);
  }
}

export class UserStatus {
  static readonly ACTIVE = "active";
  static readonly INACTIVE = "inactive";
  static readonly SUSPENDED = "suspended";
  static readonly PENDING = "pending";

  static readonly ALL = [
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.SUSPENDED,
    UserStatus.PENDING,
  ] as const;

  static isValid(status: string): boolean {
    return UserStatus.ALL.includes(status as any);
  }
}
