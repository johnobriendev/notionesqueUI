import "@testing-library/jest-dom/vitest"
import { server } from './test/mocks/server';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
