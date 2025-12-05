import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, mock } from 'bun:test';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, errorHandlers } from './mocks/handlers';
import { setupLocalStorage } from './fixtures/localStorage.mock';
import { mockAuthToken, mockUsers, mockUser } from './mocks/test-data';
import { OpenApiNetworkService } from '../openapi-network.service';
import type { ApiPaths } from './mocks/api-schema';
import { ApplicationError } from '@/utilities/error.utility';

const server = setupServer(...handlers);

describe('OpenApiNetworkService', () => {
  let service: OpenApiNetworkService<ApiPaths>;
  const BASE_URL = 'https://api.test.com';

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  beforeEach(() => {
    setupLocalStorage(mockAuthToken);

    service = new OpenApiNetworkService<ApiPaths>({
      name: 'TestService',
      baseUrl: BASE_URL,
      headers: {
        'X-Custom-Header': 'test-value',
      },
    });

    service['logger'].info = mock(() => {});
    service['logger'].error = mock(() => {});
    service['logger'].debug = mock(() => {});
  });

  describe('Client Initialization', () => {
    it('should lazily initialize client on first request', async () => {
      expect(service['client']).toBeNull();

      await service.get('/users');

      expect(service['client']).not.toBeNull();
    });

    it('should reuse cached client for subsequent requests', async () => {
      await service.get('/users');
      const firstClient = service['client'];

      await service.get('/users');
      const secondClient = service['client'];

      expect(firstClient).toBe(secondClient);
    });

    it('should deduplicate concurrent client initialization', async () => {
      const promises = [service.get('/users'), service.get('/users'), service.get('/users')];

      await Promise.all(promises);

      expect(service['client']).not.toBeNull();
    });

    it('should log client initialization', async () => {
      const infoSpy = mock(() => {});
      service['logger'].info = infoSpy;

      await service.get('/users');

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('OpenAPI client initialized'),
        BASE_URL,
      );
    });
  });

  describe('GET Method', () => {
    it('should successfully fetch list of users', async () => {
      const response = await service.get('/users');

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockUsers);
    });

    it('should successfully fetch user by ID', async () => {
      const response = await service.get('/users/{id}', {
        params: { path: { id: '1' } },
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockUser);
    });

    it('should include auth headers in request', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockUsers);
        }),
      );

      await service.get('/users');

      expect(capturedHeaders?.get('authorization')).toBe(`Bearer ${mockAuthToken.value}`);
      expect(capturedHeaders?.get('x-auth-provider')).toBe(mockAuthToken.provider);
    });

    it('should merge custom headers with default headers', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockUsers);
        }),
      );

      await service.get('/users', {
        headers: { 'X-Request-ID': 'test-123' },
      });

      expect(capturedHeaders?.get('X-Custom-Header')).toBe('test-value');
      expect(capturedHeaders?.get('X-Request-ID')).toBe('test-123');
      expect(capturedHeaders?.get('Timezone')).toBeTruthy();
      expect(capturedHeaders?.get('Timezone-Offset')).toBeTruthy();
    });

    it('should throw ApplicationError on API error', async () => {
      server.use(errorHandlers.serverError);

      try {
        await service.get('/users');
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).statusCode).toBe(500);
        expect((error as ApplicationError).message).toContain('went wrong');
      }
    });

    it('should handle 404 errors for missing resources', async () => {
      try {
        await service.get('/users/{id}', {
          params: { path: { id: 'non-existent' } },
        });
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).statusCode).toBe(404);
      }
    });

    it('should extract resource correctly from path with parameters', async () => {
      const extractSpy = mock(service['extractResource'].bind(service));
      const originalExtract = service['extractResource'].bind(service);
      service['extractResource'] = extractSpy;

      await service.get('/users/{id}', {
        params: { path: { id: '1' } },
      });

      expect(extractSpy).toHaveBeenCalledWith('/users/{id}');

      service['extractResource'] = originalExtract;
    });
  });

  describe('POST Method', () => {
    it('should successfully create a new user', async () => {
      const response = await service.post('/users', {
        body: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
        },
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toMatchObject({
        id: '3',
        name: 'Alice Johnson',
        email: 'alice@example.com',
      });
    });

    it('should include request body in POST request', async () => {
      let capturedBody: any;

      server.use(
        http.post(`${BASE_URL}/users`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ id: '3', ...capturedBody }, { status: 201 });
        }),
      );

      const requestBody = { name: 'Test User', email: 'test@example.com' };
      await service.post('/users', { body: requestBody });

      expect(capturedBody).toEqual(requestBody);
    });

    it('should handle validation errors (400)', async () => {
      try {
        await service.post('/users', {
          body: { name: '' } as any,
        });
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).statusCode).toBe(400);
      }
    });

    it('should merge custom headers for POST requests', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.post(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ id: '3' }, { status: 201 });
        }),
      );

      await service.post('/users', {
        body: { name: 'Test', email: 'test@example.com' },
        headers: { 'X-Idempotency-Key': 'unique-key' },
      });

      expect(capturedHeaders?.get('authorization')).toBeTruthy();
      expect(capturedHeaders?.get('X-Idempotency-Key')).toBe('unique-key');
    });
  });

  describe('put' + ' Method', () => {
    it('should successfully update user with full replacement', async () => {
      const response = await service.put('/users/{id}', {
        params: { path: { id: '1' } },
        body: {
          name: 'John Updated',
          email: 'john.updated@example.com',
        },
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toMatchObject({
        id: '1',
        name: 'John Updated',
        email: 'john.updated@example.com',
      });
    });

    it('should include auth headers in put' + ' request', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.put(`${BASE_URL}/users/:id`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ id: '1' });
        }),
      );

      await service.put('/users/{id}', {
        params: { path: { id: '1' } },
        body: { name: 'Test', email: 'test@example.com' },
      });

      expect(capturedHeaders?.get('authorization')).toBe(`Bearer ${mockAuthToken.value}`);
    });

    it('should extract resource from put' + ' path with parameters', async () => {
      const response = await service.put('/users/{id}', {
        params: { path: { id: '1' } },
        body: { name: 'Test', email: 'test@example.com' },
      });

      expect(response.error).toBeUndefined();
    });
  });

  describe('patch Method', () => {
    it('should successfully update user with partial data', async () => {
      const response = await service.patch('/users/{id}', {
        params: { path: { id: '1' } },
        body: {
          name: 'John Patched',
        },
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toMatchObject({
        id: '1',
        name: 'John Patched',
        email: 'john@example.com',
      });
    });

    it('should include custom headers in patch request', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.patch(`${BASE_URL}/users/:id`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ id: '1' });
        }),
      );

      await service.patch('/users/{id}', {
        params: { path: { id: '1' } },
        body: { name: 'Test' },
        headers: { 'If-Match': 'etag-123' },
      });

      expect(capturedHeaders?.get('If-Match')).toBe('etag-123');
    });
  });

  describe('delete Method', () => {
    it('should successfully delete a user', async () => {
      const response = await service.delete('/users/{id}', {
        params: { path: { id: '1' } },
      });

      expect(response.error).toBeUndefined();
      expect(response.response.status).toBe(204);
    });

    it('should include auth headers in delete request', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.delete(`${BASE_URL}/users/:id`, ({ request }) => {
          capturedHeaders = request.headers;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await service.delete('/users/{id}', {
        params: { path: { id: '1' } },
      });

      expect(capturedHeaders?.get('authorization')).toBe(`Bearer ${mockAuthToken.value}`);
    });
  });

  describe('Resource Extraction', () => {
    it('should extract base path from URL with single parameter', () => {
      const result = service['extractResource']('/users/{id}');
      expect(result).toBe('/users');
    });

    it('should extract base path from URL with multiple parameters', () => {
      const result = service['extractResource']('/users/{userId}/posts/{postId}');
      expect(result).toBe('/users');
    });

    it('should return unchanged path when no parameters exist', () => {
      const result = service['extractResource']('/users');
      expect(result).toBe('/users');
    });

    it('should remove trailing slash before parameter', () => {
      const result = service['extractResource']('/users/{id}');
      expect(result).not.toMatch(/\/$/);
      expect(result).toBe('/users');
    });

    it('should handle nested paths correctly', () => {
      const result = service['extractResource']('/api/v1/users/{id}');
      expect(result).toBe('/api/v1/users');
    });
  });

  describe('Auth Handling', () => {
    it('should use localStorage auth token when no authToken provided', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockUsers);
        }),
      );

      await service.get('/users');

      expect(capturedHeaders?.get('authorization')).toBe(`Bearer ${mockAuthToken.value}`);
    });

    it('should use injected authToken over localStorage', async () => {
      const customToken = { type: 'Bearer', value: 'custom-token-xyz' };
      service.setAuthToken(customToken);

      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockUsers);
        }),
      );

      await service.get('/users');

      expect(capturedHeaders?.get('authorization')).toBe(`Bearer ${customToken.value}`);
    });

    it('should skip auth headers for noAuthPaths', async () => {
      const publicService = new OpenApiNetworkService<ApiPaths>({
        name: 'PublicService',
        baseUrl: BASE_URL,
        noAuthPaths: ['/users'],
      });

      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockUsers);
        }),
      );

      await publicService.get('/users');

      expect(capturedHeaders?.get('authorization')).toBeNull();
    });

    it('should throw error when no auth token available', async () => {
      setupLocalStorage();

      const unauthService = new OpenApiNetworkService<ApiPaths>({
        name: 'UnauthService',
        baseUrl: BASE_URL,
      });

      try {
        await unauthService.get('/users');
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).statusCode).toBe(401);
      }
    });
  });

  describe('Error Handling', () => {
    it('should transform 401 errors to ApplicationError', async () => {
      setupLocalStorage();

      try {
        await service.get('/users');
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).statusCode).toBe(401);
      }
    });

    it('should transform 404 errors to ApplicationError', async () => {
      try {
        await service.get('/users/{id}', {
          params: { path: { id: 'non-existent' } },
        });
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).statusCode).toBe(404);
        expect((error as ApplicationError).message).toContain('not found');
      }
    });

    it('should extract error code from API response', async () => {
      try {
        await service.post('/users', {
          body: { name: '' } as any,
        });
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).messageCode).toBe('VALIDATION_ERROR');
      }
    });

    it('should include error payload in ApplicationError', async () => {
      try {
        await service.get('/users/{id}', {
          params: { path: { id: 'non-existent' } },
        });
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).payload).toBeTruthy();
      }
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get(`${BASE_URL}/users`, () => {
          return HttpResponse.error();
        }),
      );

      try {
        await service.get('/users');
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('send Method (Generic)', () => {
    it('should successfully fetch using send with GET', async () => {
      const response = await service.send('get', '/users');

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockUsers);
    });

    it('should successfully fetch with path params using send', async () => {
      const response = await service.send('get', '/users/{id}', {
        params: { path: { id: '1' } },
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockUser);
    });

    it('should successfully create using send with POST', async () => {
      const response = await service.send('post', '/users', {
        body: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
        },
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toMatchObject({
        id: '3',
        name: 'Alice Johnson',
        email: 'alice@example.com',
      });
    });

    it('should successfully update using send with PUT', async () => {
      const response = await service.send('put', '/users/{id}', {
        params: { path: { id: '1' } },
        body: {
          name: 'John Updated',
          email: 'john.updated@example.com',
        },
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toMatchObject({
        id: '1',
        name: 'John Updated',
        email: 'john.updated@example.com',
      });
    });

    it('should successfully patch using send with PATCH', async () => {
      const response = await service.send('patch', '/users/{id}', {
        params: { path: { id: '1' } },
        body: {
          name: 'John Patched',
        },
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toMatchObject({
        id: '1',
        name: 'John Patched',
        email: 'john@example.com',
      });
    });

    it('should successfully delete using send with DELETE', async () => {
      const response = await service.send('delete', '/users/{id}', {
        params: { path: { id: '1' } },
      });

      expect(response.error).toBeUndefined();
      expect(response.response.status).toBe(204);
    });

    it('should include auth headers when using send', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockUsers);
        }),
      );

      await service.send('get', '/users');

      expect(capturedHeaders?.get('authorization')).toBe(`Bearer ${mockAuthToken.value}`);
      expect(capturedHeaders?.get('x-auth-provider')).toBe(mockAuthToken.provider);
    });

    it('should merge custom headers with auth headers in send', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.post(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ id: '3' }, { status: 201 });
        }),
      );

      await service.send('post', '/users', {
        body: { name: 'Test', email: 'test@example.com' },
        headers: { 'X-Idempotency-Key': 'unique-key' },
      });

      expect(capturedHeaders?.get('authorization')).toBeTruthy();
      expect(capturedHeaders?.get('X-Idempotency-Key')).toBe('unique-key');
      expect(capturedHeaders?.get('Timezone')).toBeTruthy();
    });

    it('should handle errors correctly with send', async () => {
      server.use(errorHandlers.serverError);

      try {
        await service.send('get', '/users');
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).statusCode).toBe(500);
        expect((error as ApplicationError).message).toContain('went wrong');
      }
    });

    it('should handle 404 errors with send', async () => {
      try {
        await service.send('get', '/users/{id}', {
          params: { path: { id: 'non-existent' } },
        });
        expect.unreachable('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect((error as ApplicationError).statusCode).toBe(404);
      }
    });

    it('should extract resource correctly in send', async () => {
      const extractSpy = mock(service['extractResource'].bind(service));
      const originalExtract = service['extractResource'].bind(service);
      service['extractResource'] = extractSpy;

      await service.send('get', '/users/{id}', {
        params: { path: { id: '1' } },
      });

      expect(extractSpy).toHaveBeenCalledWith('/users/{id}');

      service['extractResource'] = originalExtract;
    });

    it('should skip auth headers for noAuthPaths with send', async () => {
      const publicService = new OpenApiNetworkService<ApiPaths>({
        name: 'PublicService',
        baseUrl: BASE_URL,
        noAuthPaths: ['/users'],
      });

      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/users`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockUsers);
        }),
      );

      await publicService.send('get', '/users');

      expect(capturedHeaders?.get('authorization')).toBeNull();
    });
  });
});
