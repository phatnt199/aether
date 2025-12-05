export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  code?: string;
}

export interface ApiPaths {
  '/users': {
    get: {
      parameters: {
        query?: {
          page?: number;
          limit?: number;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': User[];
          };
        };
        401: {
          content: {
            'application/json': ErrorResponse;
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          'application/json': CreateUserRequest;
        };
      };
      responses: {
        201: {
          content: {
            'application/json': User;
          };
        };
        400: {
          content: {
            'application/json': ErrorResponse;
          };
        };
      };
    };
  };
  '/users/{id}': {
    get: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': User;
          };
        };
        404: {
          content: {
            'application/json': ErrorResponse;
          };
        };
      };
    };
    put: {
      parameters: {
        path: {
          id: string;
        };
      };
      requestBody: {
        content: {
          'application/json': UpdateUserRequest;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': User;
          };
        };
      };
    };
    patch: {
      parameters: {
        path: {
          id: string;
        };
      };
      requestBody: {
        content: {
          'application/json': Partial<UpdateUserRequest>;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': User;
          };
        };
      };
    };
    delete: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        204: {
          content: never;
        };
      };
    };
  };
}
