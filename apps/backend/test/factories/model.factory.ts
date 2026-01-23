import { faker } from '@faker-js/faker';
import { Feature, FeatureFlag, Tenant, Environment, StrategyType } from '@prisma/client';

export class MockFactory {
    static createTenant(overrides: Partial<Tenant> = {}): Tenant {
        return {
            id: faker.string.uuid(),
            name: faker.company.name(),
            slug: faker.string.alphanumeric(10), // Required
            quotaBurst: 100, // Required
            quotaSustained: 1000, // Required
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }

    static createFeature(overrides: Partial<Feature> = {}): Feature {
        return {
            id: faker.string.uuid(),
            name: faker.word.noun(),
            key: faker.string.alphanumeric(10),
            description: faker.lorem.sentence(),
            tenantId: faker.string.uuid(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }

    static createFeatureFlag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
        return {
            id: faker.string.uuid(),
            featureId: faker.string.uuid(),
            tenantId: faker.string.uuid(), // Required
            env: faker.helpers.enumValue(Environment), // Correct prop name 'env'
            enabled: faker.datatype.boolean(),
            strategyType: faker.helpers.enumValue(StrategyType), // Correct prop name
            strategyConfig: {}, // Correct prop name
            version: 1, // Required
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
}
