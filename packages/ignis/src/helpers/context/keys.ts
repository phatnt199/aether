export const METADATA_KEY = {
  // Controller metadata
  CONTROLLER: Symbol.for('ignis:controller'),
  CONTROLLER_BASEPATH: Symbol.for('ignis:controller:basepath'),

  // Route metadata
  ROUTE: Symbol.for('ignis:route'),
  ROUTES: Symbol.for('ignis:routes'),

  // Parameter metadata
  PARAMETER: Symbol.for('ignis:parameter'),
  PARAMETERS: Symbol.for('ignis:parameters'),

  // Model metadata
  MODEL: Symbol.for('ignis:model'),
  PROPERTY: Symbol.for('ignis:property'),
  PROPERTIES: Symbol.for('ignis:properties'),

  // Relation metadata
  BELONGS_TO: Symbol.for('ignis:relation:belongsTo'),
  HAS_ONE: Symbol.for('ignis:relation:hasOne'),
  HAS_MANY: Symbol.for('ignis:relation:hasMany'),
  HAS_MANY_THROUGH: Symbol.for('ignis:relation:hasManyThrough'),
  RELATIONS: Symbol.for('ignis:relations'),

  // Injection metadata
  INJECT: Symbol.for('ignis:inject'),
  INJECTABLE: Symbol.for('ignis:injectable'),

  // Middleware/Interceptor metadata
  MIDDLEWARE: Symbol.for('ignis:middleware'),
  INTERCEPTOR: Symbol.for('ignis:interceptor'),

  // Authentication/Authorization
  AUTHENTICATE: Symbol.for('ignis:authenticate'),
  AUTHORIZE: Symbol.for('ignis:authorize'),
};
