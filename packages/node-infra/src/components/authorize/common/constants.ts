export class FixedUserRoles {
  static readonly SUPER_ADMIN = '999-super-admin';
  static readonly ADMIN = '998-admin';
  static readonly FULL_AUTHORIZE_ROLES = [this.SUPER_ADMIN, this.ADMIN];
}

export class EnforcerDefinitions {
  static readonly ACTION_EXECUTE = 'execute';
  static readonly ACTION_READ = 'read';
  static readonly ACTION_WRITE = 'write';
  static readonly PREFIX_USER = 'user';
  static readonly PREFIX_ROLE = 'role';
  static readonly PTYPE_POLICY = 'p';
  static readonly PTYPE_GROUP = 'g';
}
