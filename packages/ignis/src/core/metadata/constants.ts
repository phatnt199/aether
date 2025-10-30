export const METADATA_KEY = {
  // Controller metadata
  CONTROLLER: Symbol.for("lux:controller"),
  CONTROLLER_BASEPATH: Symbol.for("lux:controller:basepath"),

  // Route metadata
  ROUTE: Symbol.for("lux:route"),
  ROUTES: Symbol.for("lux:routes"),

  // Parameter metadata
  PARAMETER: Symbol.for("lux:parameter"),
  PARAMETERS: Symbol.for("lux:parameters"),

  // Model metadata
  MODEL: Symbol.for("lux:model"),
  PROPERTY: Symbol.for("lux:property"),
  PROPERTIES: Symbol.for("lux:properties"),

  // Relation metadata
  BELONGS_TO: Symbol.for("lux:relation:belongsTo"),
  HAS_ONE: Symbol.for("lux:relation:hasOne"),
  HAS_MANY: Symbol.for("lux:relation:hasMany"),
  HAS_MANY_THROUGH: Symbol.for("lux:relation:hasManyThrough"),
  RELATIONS: Symbol.for("lux:relations"),

  // Injection metadata
  INJECT: Symbol.for("lux:inject"),
  INJECTABLE: Symbol.for("lux:injectable"),

  // Middleware/Interceptor metadata
  MIDDLEWARE: Symbol.for("lux:middleware"),
  INTERCEPTOR: Symbol.for("lux:interceptor"),

  // Authentication/Authorization
  AUTHENTICATE: Symbol.for("lux:authenticate"),
  AUTHORIZE: Symbol.for("lux:authorize"),
};

export enum ParameterType {
  PATH = "path",
  QUERY = "query",
  HEADER = "header",
  BODY = "body",
  REQUEST = "request",
  RESPONSE = "response",
  CONTEXT = "context",
  CUSTOM = "custom",
}

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  ALL = "ALL",
}

export enum BindingScope {
  SINGLETON = "Singleton",
  TRANSIENT = "Transient",
  REQUEST = "Request",
}
