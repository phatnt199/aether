export class App {
  static readonly APPLICATION_NAME = process.env.APP_ENV_APPLICATION_NAME ?? 'APP';
  static readonly APPLICATION_SECRET =
    process.env.APP_ENV_APPLICATION_SECRET ?? 'application.secret';

  static readonly DEFAULT_LOCALE = 'en.UTF-8';
  static readonly DEFAULT_EXPLORER_PATH = '/explorer';

  static readonly DEFAULT_QUERY_LIMIT = 50;
}

export class ApplicationRoles {
  static readonly API = 'api';
}

export class Sorts {
  static readonly DESC = 'desc';
  static readonly ASC = 'asc';
}

export class ApplicationRunModes {
  static readonly MODE_START_UP = 'startup';
  static readonly MODE_MIGRATE = 'migrate';
  static readonly MODE_SEED = 'seed';
}

export class EntityRelations {
  static readonly BELONGS_TO = 'belongsTo';
  static readonly HAS_ONE = 'hasOne';
  static readonly HAS_MANY = 'hasMany';
  static readonly HAS_MANY_THROUGH = 'hasManyThrough';
  static readonly HAS_MANY_POLYMORPHIC = 'hasManyPolymorphic';

  static readonly SCHEME_SET = new Set([
    this.BELONGS_TO,
    this.HAS_ONE,
    this.HAS_MANY,
    this.HAS_MANY_THROUGH,
    this.HAS_MANY_POLYMORPHIC,
  ]);

  static isValid(type: string) {
    return this.SCHEME_SET.has(type);
  }
}

export class MimeTypes {
  static readonly UNKNOWN = 'unknown';
  static readonly IMAGE = 'image';
  static readonly VIDEO = 'video';
  static readonly TEXT = 'text';
}
