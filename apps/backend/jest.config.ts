import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
            tsconfig: 'tsconfig.spec.json',
        }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.module.ts',
        '!src/main.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.entity.ts',
        '!src/**/index.ts',
        '!src/**/*.strategy.ts',
        '!src/**/middleware/*.ts',
        '!src/**/dto/**',
        '!src/observability/**',
    ],
    coverageDirectory: './coverage',
    coveragePathIgnorePatterns: [
        'node_modules',
        'dist',
        'coverage',
        'prisma',
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 100,
            lines: 95,
            statements: 95,
        },
    },
};

export default config;
