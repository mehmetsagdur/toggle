import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from '../redis/redis.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('CacheService', () => {
    let service: CacheService;
    let redis: DeepMockProxy<RedisService>;

    const mockFlag = {
        id: 'flag-1',
        tenantId: 'tenant-1',
        featureId: 'feature-1',
        env: 'DEV',
        enabled: true,
        strategyType: 'BOOLEAN',
        strategyConfig: {},
        version: 1,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
    };

    const mockFeatures = [
        {
            id: 'feature-1',
            tenantId: 'tenant-1',
            key: 'test-key',
            name: 'Test Feature',
            description: 'Test',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheService,
                { provide: RedisService, useValue: mockDeep<RedisService>() },
            ],
        }).compile();

        service = module.get<CacheService>(CacheService);
        redis = module.get(RedisService);
    });

    describe('getFlag', () => {
        it('should return cached flag if exists', async () => {
            redis.get.mockResolvedValue(JSON.stringify(mockFlag));

            const result = await service.getFlag('tenant-1', 'feature-1', 'DEV');

            expect(result).toBeDefined();
            expect(result!.id).toBe('flag-1');
            expect(redis.get).toHaveBeenCalledWith('flag:tenant-1:feature-1:DEV');
        });

        it('should return null if not cached', async () => {
            redis.get.mockResolvedValue(null);

            const result = await service.getFlag('tenant-1', 'feature-1', 'DEV');

            expect(result).toBeNull();
        });
    });

    describe('setFlag', () => {
        it('should cache flag with TTL', async () => {
            await service.setFlag('tenant-1', 'feature-1', 'DEV', mockFlag as any);

            expect(redis.set).toHaveBeenCalledWith(
                'flag:tenant-1:feature-1:DEV',
                JSON.stringify(mockFlag),
                300
            );
        });
    });

    describe('invalidateFlag', () => {
        it('should delete cached flag', async () => {
            await service.invalidateFlag('tenant-1', 'feature-1', 'DEV');

            expect(redis.del).toHaveBeenCalledWith('flag:tenant-1:feature-1:DEV');
        });
    });

    describe('getFeatures', () => {
        it('should return cached features if exists', async () => {
            redis.get.mockResolvedValue(JSON.stringify(mockFeatures));

            const result = await service.getFeatures('tenant-1');

            expect(result).toBeDefined();
            expect(result![0].id).toBe('feature-1');
            expect(redis.get).toHaveBeenCalledWith('features:tenant-1');
        });

        it('should return null if not cached', async () => {
            redis.get.mockResolvedValue(null);

            const result = await service.getFeatures('tenant-1');

            expect(result).toBeNull();
        });
    });

    describe('setFeatures', () => {
        it('should cache features with TTL', async () => {
            await service.setFeatures('tenant-1', mockFeatures as any);

            expect(redis.set).toHaveBeenCalledWith(
                'features:tenant-1',
                JSON.stringify(mockFeatures),
                300
            );
        });
    });

    describe('invalidateFeatures', () => {
        it('should delete cached features', async () => {
            await service.invalidateFeatures('tenant-1');

            expect(redis.del).toHaveBeenCalledWith('features:tenant-1');
        });
    });

    describe('invalidateFeatureAll', () => {
        it('should invalidate features list', async () => {
            await service.invalidateFeatureAll('tenant-1', 'feature-1');

            expect(redis.del).toHaveBeenCalledWith('features:tenant-1');
        });
    });
});
