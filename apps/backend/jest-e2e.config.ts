import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.e2e-spec.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
            tsconfig: 'tsconfig.spec.json',
        }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testTimeout: 10000,
    forceExit: true,
};

export default config;
