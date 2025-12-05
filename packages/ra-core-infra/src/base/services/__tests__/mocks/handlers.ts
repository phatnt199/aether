import { http, HttpResponse } from 'msw';
import {
  mockUsers,
  mockUser,
  mockErrorResponse,
  mockUnauthorizedError,
  mockNotFoundError,
} from './test-data';

const BASE_URL = 'https://api.test.com';

export const handlers = [
  http.get(`${BASE_URL}/users`, ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockUnauthorizedError, { status: 401 });
    }

    return HttpResponse.json(mockUsers, { status: 200 });
  }),

  http.get(`${BASE_URL}/users/:id`, ({ params, request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json(mockUnauthorizedError, { status: 401 });
    }

    const { id } = params;
    const user = mockUsers.find(u => u.id === id);

    if (!user) {
      return HttpResponse.json(mockNotFoundError, { status: 404 });
    }

    return HttpResponse.json(user, { status: 200 });
  }),

  http.post(`${BASE_URL}/users`, async ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json(mockUnauthorizedError, { status: 401 });
    }

    const body = (await request.json()) as any;

    if (!body.name || !body.email) {
      return HttpResponse.json(mockErrorResponse, { status: 400 });
    }

    const newUser = {
      id: '3',
      name: body.name,
      email: body.email,
    };

    return HttpResponse.json(newUser, { status: 201 });
  }),

  http.put(`${BASE_URL}/users/:id`, async ({ params, request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json(mockUnauthorizedError, { status: 401 });
    }

    const { id } = params;
    const body = (await request.json()) as any;

    const updatedUser = {
      id: id as string,
      name: body.name,
      email: body.email,
    };

    return HttpResponse.json(updatedUser, { status: 200 });
  }),

  http.patch(`${BASE_URL}/users/:id`, async ({ params, request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json(mockUnauthorizedError, { status: 401 });
    }

    const { id } = params;
    const body = (await request.json()) as any;
    const existingUser = mockUsers.find(u => u.id === id) || mockUser;

    const patchedUser = {
      ...existingUser,
      ...body,
    };

    return HttpResponse.json(patchedUser, { status: 200 });
  }),

  http.delete(`${BASE_URL}/users/:id`, ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json(mockUnauthorizedError, { status: 401 });
    }

    return new HttpResponse(null, { status: 204 });
  }),
];

export const errorHandlers = {
  serverError: http.get(`${BASE_URL}/users`, () => {
    return HttpResponse.json(
      { error: 'Internal Server Error', message: 'Something went wrong', statusCode: 500 },
      { status: 500 },
    );
  }),
};
