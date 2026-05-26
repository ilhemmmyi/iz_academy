import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Redirect .prisma/client imports so tests don't need a compiled schema
    '^\\.prisma/client$': '<rootDir>/src/__mocks__/prismaClient.ts',
  },
  clearMocks: true,
  // Each worker imports heavy deps (Prisma, BullMQ). 512 MB prevents OOM on
  // machines with constrained heap defaults.
  workerIdleMemoryLimit: '512MB',
};

export default config;
