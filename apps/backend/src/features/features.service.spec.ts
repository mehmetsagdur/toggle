import { Test, TestingModule } from '@nestjs/testing';
import { FeaturesService } from './features.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CacheService } from '../cache/cache.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createFeature, createFeatureFlag } from '../../test/fixtures';
import { Prisma, StrategyType, Environment, AuditAction } from '@prisma/client';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('FeaturesService', () => {
    let service: FeaturesService;
    let prisma: DeepMockProxy<PrismaService>;
    let auditLog: DeepMockProxy<AuditLogService>;
    let cache: DeepMockProxy<CacheService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FeaturesService,
                { provide: PrismaService, useValue: mockDeep<PrismaService>() },
                { provide: AuditLogService, useValue: mockDeep<AuditLogService>() },
                { provide: CacheService, useValue: mockDeep<CacheService>() },
            ],
        }).compile();

        service = module.get<FeaturesService>(FeaturesService);
        prisma = module.get(PrismaService);
        auditLog = module.get(AuditLogService);
        cache = module.get(CacheService);
    });

    describe('createFeature', () => {
        it('should create a feature and invalidate cache', async () => {
            const tenantId = 'tenant-1';
            const actorId = 'user-1';
            const dto = { key: 'new-key', name: 'New Feature', description: 'Desc' };
            const feature = createFeature({ tenantId, ...dto });

            prisma.feature.create.mockResolvedValue(feature);

            const result = await service.createFeature(tenantId, dto, actorId);

            expect(result).toEqual(feature);
            expect(prisma.feature.create).toHaveBeenCalledWith({
                data: { tenantId, ...dto },
            });
            expect(auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                action: AuditAction.CREATE,
                entityType: 'Feature',
                entityId: feature.id,
            }));
            expect(cache.invalidateFeatures).toHaveBeenCalledWith(tenantId);
        });

        it('should throw ConflictException on P2002 error', async () => {
            const tenantId = 'tenant-1';
            const actorId = 'user-1';
            const dto = { key: 'duplicate', name: 'Dup', description: 'Desc' };

            prisma.feature.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('', {
                code: 'P2002',
                clientVersion: '1',
            }));

            await expect(service.createFeature(tenantId, dto, actorId)).rejects.toThrow(ConflictException);
        });

        it('should rethrow other errors', async () => {
            prisma.feature.create.mockRejectedValue(new Error('Random error'));
            await expect(service.createFeature('t1', { key: 'k', name: 'n' }, 'u1')).rejects.toThrow('Random error');
        });
    });

    describe('findAllFeatures', () => {
        it('should return cached data if available (page 1, no search)', async () => {
            const tenantId = 'tenant-1';
            const cachedFeatures = [createFeature()];
            cache.getFeatures.mockResolvedValue(cachedFeatures);

            const result = await service.findAllFeatures(tenantId, {});

            expect(result).toEqual({ data: cachedFeatures, total: 1, page: 1, limit: 20 });
            expect(prisma.feature.findMany).not.toHaveBeenCalled();
        });

        it('should fetch from DB and cache if not in cache (page 1, no search)', async () => {
            const tenantId = 'tenant-1';
            const features = [createFeature()];
            cache.getFeatures.mockResolvedValue(null);
            prisma.feature.findMany.mockResolvedValue(features);
            prisma.feature.count.mockResolvedValue(1);

            const result = await service.findAllFeatures(tenantId, {});

            expect(result.data).toEqual(features);
            expect(cache.setFeatures).toHaveBeenCalledWith(tenantId, features);
        });

        it('should not check/set cache if search query is present', async () => {
            const tenantId = 'tenant-1';
            const features = [createFeature()];
            prisma.feature.findMany.mockResolvedValue(features);
            prisma.feature.count.mockResolvedValue(1);

            await service.findAllFeatures(tenantId, { search: 'term' });

            expect(cache.getFeatures).not.toHaveBeenCalled();
            expect(cache.setFeatures).not.toHaveBeenCalled();
        });
    });

    describe('findOneFeature', () => {
        it('should return feature if found', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);

            await expect(service.findOneFeature(feature.tenantId, feature.id)).resolves.toEqual(feature);
        });

        it('should throw NotFoundException if not found', async () => {
            prisma.feature.findFirst.mockResolvedValue(null);
            await expect(service.findOneFeature('t1', 'id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findFeatureByKey', () => {
        it('should return feature if found', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);

            await expect(service.findFeatureByKey(feature.tenantId, feature.key)).resolves.toEqual(feature);
        });

        it('should throw NotFoundException if not found', async () => {
            prisma.feature.findFirst.mockResolvedValue(null);
            await expect(service.findFeatureByKey('t1', 'key')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateFeature', () => {
        it('should update feature and log audit', async () => {
            const feature = createFeature();
            const updated = { ...feature, name: 'Updated' };

            prisma.feature.findFirst.mockResolvedValue(feature);
            prisma.feature.update.mockResolvedValue(updated);

            const result = await service.updateFeature(feature.tenantId, feature.id, { name: 'Updated' }, 'user-1');

            expect(result).toEqual(updated);
            expect(auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                action: AuditAction.UPDATE,
            }));
        });
    });

    describe('removeFeature', () => {
        it('should delete feature and log audit', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);

            await service.removeFeature(feature.tenantId, feature.id, 'user-1');

            expect(prisma.feature.delete).toHaveBeenCalledWith({ where: { id: feature.id } });
            expect(auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                action: AuditAction.DELETE,
            }));
        });
    });

    describe('createFlag', () => {
        it('should create flag and invalidate cache', async () => {
            const feature = createFeature();
            const flag = createFeatureFlag({
                featureId: feature.id,
                strategyType: StrategyType.BOOLEAN
            });
            const dto = {
                env: flag.env,
                enabled: true,
                strategyType: StrategyType.BOOLEAN,
                strategyConfig: {}
            };

            prisma.feature.findFirst.mockResolvedValue(feature);
            prisma.featureFlag.create.mockResolvedValue(flag);

            const result = await service.createFlag(feature.tenantId, feature.id, dto as any, 'user-1');

            expect(result).toEqual(flag);
            expect(cache.invalidateFlag).toHaveBeenCalledWith(feature.tenantId, feature.id, dto.env);
        });

        it('should throw ConflictException on P2002', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            prisma.featureFlag.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('', {
                code: 'P2002',
                clientVersion: '1',
            }));

            const dto = { env: Environment.DEV, enabled: true, strategyType: StrategyType.BOOLEAN };
            await expect(service.createFlag(feature.tenantId, feature.id, dto as any, 'u1')).rejects.toThrow(ConflictException);
        });

        it('should rethrow other errors', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            prisma.featureFlag.create.mockRejectedValue(new Error('Err'));

            const dto = { env: Environment.DEV, enabled: true, strategyType: StrategyType.BOOLEAN };
            await expect(service.createFlag(feature.tenantId, feature.id, dto as any, 'u1')).rejects.toThrow('Err');
        });
    });

    describe('findAllFlags', () => {
        it('should return all flags for a feature', async () => {
            const feature = createFeature();
            const flags = [createFeatureFlag({ featureId: feature.id })];
            prisma.feature.findFirst.mockResolvedValue(feature);
            prisma.featureFlag.findMany.mockResolvedValue(flags);

            const result = await service.findAllFlags(feature.tenantId, feature.id);

            expect(result).toEqual(flags);
            expect(prisma.featureFlag.findMany).toHaveBeenCalledWith({
                where: { tenantId: feature.tenantId, featureId: feature.id },
                orderBy: { env: 'asc' },
            });
        });
    });

    describe('findFlag', () => {
        it('should return cached flag', async () => {
            const flag = createFeatureFlag();
            cache.getFlag.mockResolvedValue(flag);

            await expect(service.findFlag('t1', 'f1', Environment.DEV)).resolves.toEqual(flag);
            expect(prisma.featureFlag.findFirst).not.toHaveBeenCalled();
        });

        it('should fetch from DB and cache if miss', async () => {
            const flag = createFeatureFlag();
            cache.getFlag.mockResolvedValue(null);
            prisma.featureFlag.findFirst.mockResolvedValue(flag);

            await expect(service.findFlag('t1', 'f1', Environment.DEV)).resolves.toEqual(flag);
            expect(cache.setFlag).toHaveBeenCalled();
        });

        it('should throw NotFoundException if missing', async () => {
            cache.getFlag.mockResolvedValue(null);
            prisma.featureFlag.findFirst.mockResolvedValue(null);
            await expect(service.findFlag('t1', 'f1', Environment.DEV)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateFlag', () => {
        it('should update flag and audit', async () => {
            const flag = createFeatureFlag();
            cache.getFlag.mockResolvedValue(flag);
            prisma.featureFlag.update.mockResolvedValue({ ...flag, enabled: false });

            await service.updateFlag('t1', flag.featureId, flag.env, { enabled: false }, 'u1');

            expect(prisma.featureFlag.update).toHaveBeenCalled();
            expect(auditLog.create).toHaveBeenCalled();
        });

        it('should validate new strategy config', async () => {
            const flag = createFeatureFlag({ strategyType: StrategyType.PERCENTAGE });
            cache.getFlag.mockResolvedValue(flag);

            const dto = { strategyConfig: { percentage: 101 } };

            await expect(service.updateFlag('t1', flag.featureId, flag.env, dto, 'u1'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('removeFlag', () => {
        it('should remove flag', async () => {
            const flag = createFeatureFlag();
            cache.getFlag.mockResolvedValue(flag);

            await service.removeFlag('t1', flag.featureId, flag.env, 'u1');

            expect(prisma.featureFlag.delete).toHaveBeenCalledWith({ where: { id: flag.id } });
        });
    });

    describe('Evaluation Engine', () => {
        it('should return disabled if feature not found', async () => {
            prisma.feature.findFirst.mockResolvedValue(null);
            const res = await service.evaluate('t1', 'key', Environment.DEV, { userId: 'u1' });
            expect(res.enabled).toBe(false);
            expect(res.reason).toBe('flag_disabled');
        });

        it('should return disabled if flag not found', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            cache.getFlag.mockResolvedValue(null);
            prisma.featureFlag.findFirst.mockResolvedValue(null);

            const res = await service.evaluate('t1', 'key', Environment.DEV, { userId: 'u1' });
            expect(res.enabled).toBe(false);
            expect(res.reason).toBe('flag_disabled');
        });

        it('should return disabled if flag exist but enabled=false', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({ enabled: false });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, { userId: 'u1' });
            expect(res.enabled).toBe(false);
        });

        it('Evaluate: BOOLEAN', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({ enabled: true, strategyType: StrategyType.BOOLEAN });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, {});
            expect(res.enabled).toBe(true);
            expect(res.reason).toBe('boolean');
        });

        it('Evaluate: PERCENTAGE (0%)', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({
                enabled: true,
                strategyType: StrategyType.PERCENTAGE,
                strategyConfig: { percentage: 0 }
            });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, { userId: 'u1' });
            expect(res.enabled).toBe(false);
            expect(res.reason).toBe('percentage_miss');
        });

        it('Evaluate: PERCENTAGE (100%)', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({
                enabled: true,
                strategyType: StrategyType.PERCENTAGE,
                strategyConfig: { percentage: 100 }
            });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, { userId: 'u1' });
            expect(res.enabled).toBe(true);
            expect(res.reason).toBe('percentage_match');
        });

        it('Evaluate: USER_TARGETING - match', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({
                enabled: true,
                strategyType: StrategyType.USER_TARGETING,
                strategyConfig: {
                    defaultValue: false,
                    rules: [{ attribute: 'email', operator: 'contains', values: ['@acme.com'] }]
                }
            });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, {
                context: { email: 'john@acme.com' }
            });
            expect(res.enabled).toBe(true);
            expect(res.reason).toBe('targeting_match');
        });

        it('Evaluate: USER_TARGETING - miss', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({
                enabled: true,
                strategyType: StrategyType.USER_TARGETING,
                strategyConfig: {
                    defaultValue: false,
                    rules: [{ attribute: 'role', operator: 'equals', values: ['admin'] }]
                }
            });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, {
                context: { role: 'user' }
            });
            expect(res.enabled).toBe(false);
            expect(res.reason).toBe('targeting_default');
        });

        it('Evaluate: UNKNOWN Strategy', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({ enabled: true });
            (flag as any).strategyType = 'UNKNOWN';
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, {});
            expect(res.enabled).toBe(false);
        });
    });

    describe('Validation', () => {
        it('should throw on invalid Percentage config', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);

            const dto = {
                env: Environment.DEV, enabled: true,
                strategyType: StrategyType.PERCENTAGE,
                strategyConfig: { percentage: 150 }
            };

            await expect(service.createFlag('t1', feature.id, dto as any, 'u1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw on Percentage config without number', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);

            const dto = {
                env: Environment.DEV, enabled: true,
                strategyType: StrategyType.PERCENTAGE,
                strategyConfig: { percentage: 'invalid' }
            };

            await expect(service.createFlag('t1', feature.id, dto as any, 'u1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw on missing User Targeting rules', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);

            const dto = {
                env: Environment.DEV, enabled: true,
                strategyType: StrategyType.USER_TARGETING,
                strategyConfig: {}
            };

            await expect(service.createFlag('t1', feature.id, dto as any, 'u1'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('Edge Cases', () => {
        it('evaluateUserTargeting: should skip rule if attribute missing', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({
                enabled: true,
                strategyType: StrategyType.USER_TARGETING,
                strategyConfig: {
                    defaultValue: false,
                    rules: [
                        { attribute: 'missing', operator: 'equals', values: ['val'] },
                        { attribute: 'role', operator: 'equals', values: ['admin'] }
                    ]
                }
            });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, {
                context: { role: 'admin' }
            });
            expect(res.enabled).toBe(true);
        });

        it('evaluateRule: in operator', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({
                enabled: true,
                strategyType: StrategyType.USER_TARGETING,
                strategyConfig: {
                    defaultValue: false,
                    rules: [{ attribute: 'role', operator: 'in', values: ['admin', 'super'] }]
                }
            });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, { context: { role: 'super' } });
            expect(res.enabled).toBe(true);
        });

        it('evaluateRule: unknown operator', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({
                enabled: true,
                strategyType: StrategyType.USER_TARGETING,
                strategyConfig: {
                    defaultValue: true,
                    rules: [{ attribute: 'role', operator: 'magic', values: ['val'] }]
                }
            });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, { context: { role: 'val' } });
            expect(res.enabled).toBe(true);
            expect(res.reason).toBe('targeting_default');
        });

        it('evaluateUserTargeting: empty rules array', async () => {
            const feature = createFeature();
            prisma.feature.findFirst.mockResolvedValue(feature);
            const flag = createFeatureFlag({
                enabled: true,
                strategyType: StrategyType.USER_TARGETING,
                strategyConfig: {
                    defaultValue: true,
                    rules: []
                }
            });
            cache.getFlag.mockResolvedValue(flag);

            const res = await service.evaluate('t1', 'key', Environment.DEV, {});
            expect(res.enabled).toBe(true);
        });
    });
    describe('promoteFeatures', () => {
        const tenantId = 't1';
        const feature = createFeature({ tenantId, key: 'f1' });
        const sourceFlag = createFeatureFlag({
            featureId: feature.id,
            env: Environment.DEV,
            enabled: true,
            strategyType: StrategyType.BOOLEAN
        });

        beforeEach(() => {
            // Setup default mocking for findMany to return our feature + flags
            prisma.feature.findMany.mockResolvedValue([
                { ...feature, flags: [sourceFlag] } as any
            ]);
        });

        it('should throw if source == target', async () => {
            await expect(service.promoteFeatures(tenantId, {
                sourceEnv: Environment.DEV,
                targetEnv: Environment.DEV
            }, 'u1')).rejects.toThrow(BadRequestException);
        });

        it('should CREATE flag in target if missing', async () => {
            // Target flag missing in the mock setup above
            service.createFlag = jest.fn().mockResolvedValue({} as any);

            const result = await service.promoteFeatures(tenantId, {
                sourceEnv: Environment.DEV,
                targetEnv: Environment.PROD,
                dryRun: false
            }, 'u1');

            expect(result.stats.flagsCreated).toBe(1);
            expect(result.changes[0].action).toBe('CREATE');
            expect(service.createFlag).toHaveBeenCalledWith(
                tenantId, feature.id,
                expect.objectContaining({ env: Environment.PROD, enabled: true }),
                'u1'
            );
        });

        it('should UPDATE flag in target if different', async () => {
            const targetFlag = createFeatureFlag({
                featureId: feature.id,
                env: Environment.PROD,
                enabled: false // Different from source (true)
            });

            prisma.feature.findMany.mockResolvedValue([
                { ...feature, flags: [sourceFlag, targetFlag] } as any
            ]);
            service.updateFlag = jest.fn().mockResolvedValue({} as any);

            const result = await service.promoteFeatures(tenantId, {
                sourceEnv: Environment.DEV,
                targetEnv: Environment.PROD,
                dryRun: false
            }, 'u1');

            expect(result.stats.flagsUpdated).toBe(1);
            expect(result.changes[0].action).toBe('UPDATE');
            expect(service.updateFlag).toHaveBeenCalledWith(
                tenantId, feature.id, Environment.PROD,
                expect.objectContaining({ enabled: true }),
                'u1'
            );
        });

        it('should SKIP if flags are identical', async () => {
            const targetFlag = createFeatureFlag({
                featureId: feature.id,
                env: Environment.PROD,
                enabled: true,
                strategyType: StrategyType.BOOLEAN,
                strategyConfig: sourceFlag.strategyConfig
            });

            prisma.feature.findMany.mockResolvedValue([
                { ...feature, flags: [sourceFlag, targetFlag] } as any
            ]);
            service.updateFlag = jest.fn();

            const result = await service.promoteFeatures(tenantId, {
                sourceEnv: Environment.DEV,
                targetEnv: Environment.PROD
            }, 'u1');

            expect(result.stats.flagsSkipped).toBe(1);
            expect(result.changes[0].action).toBe('SKIP');
            expect(service.updateFlag).not.toHaveBeenCalled();
        });

        it('should NOT persist changes in dryRun', async () => {
            // Target missing -> would be CREATE
            service.createFlag = jest.fn();

            const result = await service.promoteFeatures(tenantId, {
                sourceEnv: Environment.DEV,
                targetEnv: Environment.PROD,
                dryRun: true
            }, 'u1');

            expect(result.stats.flagsCreated).toBe(1); // Reports what WOULD happen
            expect(service.createFlag).not.toHaveBeenCalled();
        });

        it('should filter by featureKeys if provided', async () => {
            service.createFlag = jest.fn();
            service.updateFlag = jest.fn();

            await service.promoteFeatures(tenantId, {
                sourceEnv: Environment.DEV,
                targetEnv: Environment.PROD,
                featureKeys: ['f1']
            }, 'u1');

            expect(prisma.feature.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ key: { in: ['f1'] } })
            }));
        });
    });
});
