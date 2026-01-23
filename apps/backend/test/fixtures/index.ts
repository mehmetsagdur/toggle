import { Feature, FeatureFlag, Tenant, Environment, StrategyType } from '@prisma/client';

let idCounter = 0;
const nextId = () => `test-id-${++idCounter}`;

export function resetFactories(): void {
    idCounter = 0;
}

export function createTenant(overrides: Partial<Tenant> = {}): Tenant {
    const id = nextId();
    return {
        id,
        name: `Test Tenant ${id}`,
        slug: `test-tenant-${id}`,
        quotaBurst: 100,
        quotaSustained: 1000,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        ...overrides,
    };
}

export function createFeature(overrides: Partial<Feature> = {}): Feature {
    const id = nextId();
    return {
        id,
        tenantId: overrides.tenantId ?? nextId(),
        key: `feature-key-${id}`,
        name: `Test Feature ${id}`,
        description: `Description for feature ${id}`,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        ...overrides,
    };
}

export function createFeatureFlag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
    const id = nextId();
    return {
        id,
        tenantId: overrides.tenantId ?? nextId(),
        featureId: overrides.featureId ?? nextId(),
        env: Environment.DEV,
        enabled: true,
        strategyType: StrategyType.BOOLEAN,
        strategyConfig: {},
        version: 1,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        ...overrides,
    };
}