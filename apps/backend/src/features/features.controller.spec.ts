import { Test, TestingModule } from '@nestjs/testing';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Environment, StrategyType } from '@prisma/client';
import { EvaluationResultDto } from './dto';

describe('FeaturesController', () => {
    let controller: FeaturesController;
    let service: DeepMockProxy<FeaturesService>;

    const mockFeature = {
        id: 'feature-1',
        tenantId: 'tenant-1',
        key: 'test-feature',
        name: 'Test Feature',
        description: 'A test feature',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
    };

    const mockFlag = {
        id: 'flag-1',
        tenantId: 'tenant-1',
        featureId: 'feature-1',
        env: Environment.DEV,
        enabled: true,
        strategyType: StrategyType.BOOLEAN,
        strategyConfig: {},
        version: 1,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
    };

    const mockUser = {
        userId: 'user-1',
        tenantId: 'tenant-1',
        email: 'test@example.com',
        role: 'admin' as const,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FeaturesController],
            providers: [
                { provide: FeaturesService, useValue: mockDeep<FeaturesService>() },
            ],
        }).compile();

        controller = module.get<FeaturesController>(FeaturesController);
        service = module.get(FeaturesService);
    });

    describe('Feature Endpoints', () => {
        it('createFeature should create a feature', async () => {
            service.createFeature.mockResolvedValue(mockFeature);

            const result = await controller.createFeature('tenant-1', { key: 'test', name: 'Test' }, mockUser);

            expect(result).toEqual(mockFeature);
            expect(service.createFeature).toHaveBeenCalledWith('tenant-1', { key: 'test', name: 'Test' }, 'user-1');
        });

        it('listFeatures should return paginated features', async () => {
            const response = { data: [mockFeature], total: 1, page: 1, limit: 20 };
            service.findAllFeatures.mockResolvedValue(response);

            const result = await controller.listFeatures('tenant-1', {});

            expect(result).toEqual(response);
        });

        it('getFeature should return a feature', async () => {
            service.findOneFeature.mockResolvedValue(mockFeature);

            const result = await controller.getFeature('tenant-1', 'feature-1');

            expect(result).toEqual(mockFeature);
        });

        it('updateFeature should update a feature', async () => {
            const updated = { ...mockFeature, name: 'Updated' };
            service.updateFeature.mockResolvedValue(updated);

            const result = await controller.updateFeature('tenant-1', 'feature-1', { name: 'Updated' }, mockUser);

            expect(result).toEqual(updated);
        });

        it('deleteFeature should remove a feature', async () => {
            service.removeFeature.mockResolvedValue();

            await controller.deleteFeature('tenant-1', 'feature-1', mockUser);

            expect(service.removeFeature).toHaveBeenCalledWith('tenant-1', 'feature-1', 'user-1');
        });
    });

    describe('Flag Endpoints', () => {
        it('createFlag should create a flag', async () => {
            service.createFlag.mockResolvedValue(mockFlag);

            const dto = { env: Environment.DEV, enabled: true, strategyType: StrategyType.BOOLEAN };
            const result = await controller.createFlag('tenant-1', 'feature-1', dto as any, mockUser);

            expect(result).toEqual(mockFlag);
        });

        it('listFlags should return flags', async () => {
            service.findAllFlags.mockResolvedValue([mockFlag]);

            const result = await controller.listFlags('tenant-1', 'feature-1');

            expect(result).toEqual([mockFlag]);
        });

        it('getFlag should return a flag', async () => {
            service.findFlag.mockResolvedValue(mockFlag);

            const result = await controller.getFlag('tenant-1', 'feature-1', Environment.DEV);

            expect(result).toEqual(mockFlag);
        });

        it('updateFlag should update a flag', async () => {
            const updated = { ...mockFlag, enabled: false };
            service.updateFlag.mockResolvedValue(updated);

            const result = await controller.updateFlag('tenant-1', 'feature-1', Environment.DEV, { enabled: false }, mockUser);

            expect(result).toEqual(updated);
        });

        it('deleteFlag should remove a flag', async () => {
            service.removeFlag.mockResolvedValue();

            await controller.deleteFlag('tenant-1', 'feature-1', Environment.DEV, mockUser);

            expect(service.removeFlag).toHaveBeenCalledWith('tenant-1', 'feature-1', Environment.DEV, 'user-1');
        });
    });

    describe('Evaluation Endpoint', () => {
        it('evaluate should return evaluation result', async () => {
            const evalResult: EvaluationResultDto = { enabled: true, reason: 'boolean', featureKey: 'test' };
            service.evaluate.mockResolvedValue(evalResult);

            const result = await controller.evaluate('tenant-1', 'test-feature', Environment.PROD, {});

            expect(result).toEqual(evalResult);
            expect(service.evaluate).toHaveBeenCalledWith('tenant-1', 'test-feature', Environment.PROD, {});
        });
    });
});
