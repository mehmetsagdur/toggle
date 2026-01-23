import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateFeatureDto,
    UpdateFeatureDto,
    FeatureResponseDto,
    CreateFeatureFlagDto,
    UpdateFeatureFlagDto,
    FeatureFlagResponseDto,
    EvaluateFeatureDto,
    EvaluationResultDto,
    ListFeaturesQueryDto,
    PromoteFeaturesDto,
    PromotionResultDto,
} from './dto';
import { Prisma, Environment, StrategyType, AuditAction, ActorType } from '@prisma/client';
import * as crypto from 'crypto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CacheService } from '../cache/cache.service';

interface PercentageConfig {
    percentage: number;
}

interface UserTargetingRule {
    attribute: string;
    operator: string;
    values: string[];
}

interface UserTargetingConfig {
    rules: UserTargetingRule[];
    defaultValue: boolean;
}

@Injectable()
export class FeaturesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLog: AuditLogService,
        private readonly cache: CacheService,
    ) { }

    async createFeature(
        tenantId: string,
        dto: CreateFeatureDto,
        actorId: string,
    ): Promise<FeatureResponseDto> {
        try {
            const feature = await this.prisma.feature.create({
                data: {
                    tenantId,
                    key: dto.key,
                    name: dto.name,
                    description: dto.description,
                },
            });

            await this.auditLog.create({
                tenantId,
                actorId,
                actorType: ActorType.USER,
                action: AuditAction.CREATE,
                entityType: 'Feature',
                entityId: feature.id,
                afterState: feature as unknown as Prisma.JsonValue,
            });

            await this.cache.invalidateFeatures(tenantId);
            return feature;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    `Feature with key "${dto.key}" already exists for this tenant`,
                );
            }
            throw error;
        }
    }

    async findAllFeatures(
        tenantId: string,
        query: ListFeaturesQueryDto,
    ): Promise<{ data: FeatureResponseDto[]; total: number; page: number; limit: number }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.FeatureWhereInput = {
            tenantId,
            ...(query.search && {
                OR: [
                    { key: { contains: query.search, mode: 'insensitive' } },
                    { name: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };

        if (page === 1 && !query.search) {
            const cached = await this.cache.getFeatures(tenantId);
            if (cached) {
                return { data: cached, total: cached.length, page, limit };
            }
        }

        const [data, total] = await Promise.all([
            this.prisma.feature.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.feature.count({ where }),
        ]);

        if (page === 1 && !query.search) {
            await this.cache.setFeatures(tenantId, data);
        }

        return { data, total, page, limit };
    }

    async findOneFeature(tenantId: string, id: string): Promise<FeatureResponseDto> {
        const feature = await this.prisma.feature.findFirst({
            where: { id, tenantId },
        });

        if (!feature) {
            throw new NotFoundException(`Feature not found`);
        }

        return feature;
    }

    async findFeatureByKey(tenantId: string, key: string): Promise<FeatureResponseDto> {
        const feature = await this.prisma.feature.findFirst({
            where: { tenantId, key },
        });

        if (!feature) {
            throw new NotFoundException(`Feature with key "${key}" not found`);
        }

        return feature;
    }

    async updateFeature(
        tenantId: string,
        id: string,
        dto: UpdateFeatureDto,
        actorId: string,
    ): Promise<FeatureResponseDto> {
        const beforeState = await this.findOneFeature(tenantId, id);

        const afterState = await this.prisma.feature.update({
            where: { id },
            data: dto,
        });

        await this.auditLog.create({
            tenantId,
            actorId,
            actorType: ActorType.USER,
            action: AuditAction.UPDATE,
            entityType: 'Feature',
            entityId: id,
            beforeState: beforeState as unknown as Prisma.JsonValue,
            afterState: afterState as unknown as Prisma.JsonValue,
        });

        return afterState;
    }

    async removeFeature(tenantId: string, id: string, actorId: string): Promise<void> {
        const beforeState = await this.findOneFeature(tenantId, id);

        await this.prisma.feature.delete({
            where: { id },
        });

        await this.auditLog.create({
            tenantId,
            actorId,
            actorType: ActorType.USER,
            action: AuditAction.DELETE,
            entityType: 'Feature',
            entityId: id,
            beforeState: beforeState as unknown as Prisma.JsonValue,
        });

        // Invalidate cache so deleted feature doesn't reappear
        await this.cache.invalidateFeatures(tenantId);
    }

    async createFlag(
        tenantId: string,
        featureId: string,
        dto: CreateFeatureFlagDto,
        actorId: string,
    ): Promise<FeatureFlagResponseDto> {
        await this.findOneFeature(tenantId, featureId);

        this.validateStrategyConfig(dto.strategyType, dto.strategyConfig);

        try {
            const flag = await this.prisma.featureFlag.create({
                data: {
                    tenantId,
                    featureId,
                    env: dto.env,
                    enabled: dto.enabled,
                    strategyType: dto.strategyType,
                    strategyConfig: dto.strategyConfig as Prisma.InputJsonValue,
                },
            });

            await this.auditLog.create({
                tenantId,
                actorId,
                actorType: ActorType.USER,
                action: AuditAction.CREATE,
                entityType: 'FeatureFlag',
                entityId: flag.id,
                afterState: flag as unknown as Prisma.JsonValue,
            });

            await this.cache.invalidateFlag(tenantId, featureId, dto.env);
            return flag;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    `Flag for environment "${dto.env}" already exists for this feature`,
                );
            }
            throw error;
        }
    }

    async findAllFlags(
        tenantId: string,
        featureId: string,
    ): Promise<FeatureFlagResponseDto[]> {
        await this.findOneFeature(tenantId, featureId);

        return this.prisma.featureFlag.findMany({
            where: { tenantId, featureId },
            orderBy: { env: 'asc' },
        });
    }

    async findFlag(
        tenantId: string,
        featureId: string,
        env: Environment,
    ): Promise<FeatureFlagResponseDto> {
        const cached = await this.cache.getFlag(tenantId, featureId, env);
        if (cached) {
            return cached;
        }

        const flag = await this.prisma.featureFlag.findFirst({
            where: { tenantId, featureId, env },
        });

        if (!flag) {
            throw new NotFoundException(`Flag for environment "${env}" not found`);
        }

        await this.cache.setFlag(tenantId, featureId, env, flag as unknown as FeatureFlagResponseDto);

        return flag;
    }

    async updateFlag(
        tenantId: string,
        featureId: string,
        env: Environment,
        dto: UpdateFeatureFlagDto,
        actorId: string,
    ): Promise<FeatureFlagResponseDto> {
        const existingFlag = await this.findFlag(tenantId, featureId, env);

        const newStrategyType = dto.strategyType ?? existingFlag.strategyType;
        if (dto.strategyConfig) {
            this.validateStrategyConfig(newStrategyType, dto.strategyConfig);
        }

        const afterState = await this.prisma.featureFlag.update({
            where: { id: existingFlag.id },
            data: {
                ...dto,
                strategyConfig: dto.strategyConfig as Prisma.InputJsonValue,
                version: { increment: 1 }, // Increment version for ETag support
            },
        });

        await this.auditLog.create({
            tenantId,
            actorId,
            actorType: ActorType.USER,
            action: AuditAction.UPDATE,
            entityType: 'FeatureFlag',
            entityId: existingFlag.id,
            beforeState: existingFlag as unknown as Prisma.JsonValue,
            afterState: afterState as unknown as Prisma.JsonValue,
        });

        return afterState;
    }

    async removeFlag(
        tenantId: string,
        featureId: string,
        env: Environment,
        actorId: string,
    ): Promise<void> {
        const flag = await this.findFlag(tenantId, featureId, env);

        await this.prisma.featureFlag.delete({
            where: { id: flag.id },
        });

        await this.auditLog.create({
            tenantId,
            actorId,
            actorType: ActorType.USER,
            action: AuditAction.DELETE,
            entityType: 'FeatureFlag',
            entityId: flag.id,
            beforeState: flag as unknown as Prisma.JsonValue,
        });

        // Invalidate cache so deleted flag doesn't reappear
        await this.cache.invalidateFlag(tenantId, featureId, env);
    }

    async evaluate(
        tenantId: string,
        featureKey: string,
        env: Environment,
        context: EvaluateFeatureDto,
    ): Promise<EvaluationResultDto> {
        const feature = await this.prisma.feature.findFirst({
            where: { tenantId, key: featureKey },
        });

        if (!feature) {
            return {
                featureKey,
                enabled: false,
                reason: 'flag_disabled',
            };
        }

        let flag;
        try {
            flag = await this.findFlag(tenantId, feature.id, env);
        } catch {
            return { featureKey, enabled: false, reason: 'flag_disabled' };
        }

        if (!flag || !flag.enabled) {
            return {
                featureKey,
                enabled: false,
                reason: 'flag_disabled',
            };
        }

        return this.evaluateStrategy(featureKey, flag.strategyType, flag.strategyConfig, context);
    }

    private evaluateStrategy(
        featureKey: string,
        strategyType: StrategyType,
        config: Prisma.JsonValue,
        context: EvaluateFeatureDto,
    ): EvaluationResultDto {
        switch (strategyType) {
            case StrategyType.BOOLEAN:
                return { featureKey, enabled: true, reason: 'boolean' };

            case StrategyType.PERCENTAGE:
                return this.evaluatePercentage(
                    featureKey,
                    config as unknown as PercentageConfig,
                    context,
                );

            case StrategyType.USER_TARGETING:
                return this.evaluateUserTargeting(
                    featureKey,
                    config as unknown as UserTargetingConfig,
                    context,
                );

            default:
                return { featureKey, enabled: false, reason: 'flag_disabled' };
        }
    }

    private evaluatePercentage(
        featureKey: string,
        config: PercentageConfig,
        context: EvaluateFeatureDto,
    ): EvaluationResultDto {
        const percentage = config?.percentage ?? 0;

        const identifier = context.userId ?? crypto.randomUUID();
        const hash = crypto.createHash('md5').update(`${featureKey}:${identifier}`).digest('hex');
        const bucket = parseInt(hash.substring(0, 8), 16) % 100;

        const enabled = bucket < percentage;

        return {
            featureKey,
            enabled,
            reason: enabled ? 'percentage_match' : 'percentage_miss',
        };
    }

    private evaluateUserTargeting(
        featureKey: string,
        config: UserTargetingConfig,
        context: EvaluateFeatureDto,
    ): EvaluationResultDto {
        if (!config?.rules || config.rules.length === 0) {
            return {
                featureKey,
                enabled: config?.defaultValue ?? false,
                reason: 'targeting_default',
            };
        }

        const contextMap: Record<string, unknown> = {
            userId: context.userId,
            ...context.context,
        };

        for (const rule of config.rules) {
            const attributeValue = contextMap[rule.attribute];

            if (attributeValue === undefined) continue;

            const matches = this.evaluateRule(rule, String(attributeValue));
            if (matches) {
                return { featureKey, enabled: true, reason: 'targeting_match' };
            }
        }

        return {
            featureKey,
            enabled: config.defaultValue,
            reason: 'targeting_default',
        };
    }

    private evaluateRule(rule: UserTargetingRule, value: string): boolean {
        switch (rule.operator) {
            case 'equals':
                return rule.values.includes(value);
            case 'contains':
                return rule.values.some((v) => value.includes(v));
            case 'in':
                return rule.values.includes(value);
            default:
                return false;
        }
    }

    async promoteFeatures(
        tenantId: string,
        dto: PromoteFeaturesDto,
        actorId: string,
    ): Promise<PromotionResultDto> {
        if (dto.sourceEnv === dto.targetEnv) {
            throw new BadRequestException('Source and target environments must be different');
        }

        // 1. Fetch features (filtered if keys provided)
        const whereClause: Prisma.FeatureWhereInput = { tenantId };
        if (dto.featureKeys && dto.featureKeys.length > 0) {
            whereClause.key = { in: dto.featureKeys };
        }

        const features = await this.prisma.feature.findMany({
            where: whereClause,
            include: {
                flags: {
                    where: {
                        env: { in: [dto.sourceEnv, dto.targetEnv] },
                    },
                },
            },
        });

        const result: PromotionResultDto = {
            sourceEnv: dto.sourceEnv,
            targetEnv: dto.targetEnv,
            dryRun: dto.dryRun || false,
            stats: {
                featuresScanned: features.length,
                flagsCreated: 0,
                flagsUpdated: 0,
                flagsSkipped: 0,
            },
            changes: [],
        };

        for (const feature of features) {
            const sourceFlag = feature.flags.find((f) => f.env === dto.sourceEnv);
            const targetFlag = feature.flags.find((f) => f.env === dto.targetEnv);

            if (!sourceFlag) {
                result.changes.push({
                    featureKey: feature.key,
                    action: 'SKIP',
                    diff: [{ field: 'source_flag', oldValue: null, newValue: null }],
                });
                result.stats.flagsSkipped++;
                continue;
            }

            if (!targetFlag) {
                result.stats.flagsCreated++;
                result.changes.push({
                    featureKey: feature.key,
                    action: 'CREATE',
                    diff: [
                        { field: 'enabled', oldValue: null, newValue: sourceFlag.enabled },
                        { field: 'strategyType', oldValue: null, newValue: sourceFlag.strategyType },
                    ],
                });

                if (!dto.dryRun) {
                    await this.createFlag(
                        tenantId,
                        feature.id,
                        {
                            env: dto.targetEnv,
                            enabled: sourceFlag.enabled,
                            strategyType: sourceFlag.strategyType,
                            strategyConfig: sourceFlag.strategyConfig as any,
                        },
                        actorId,
                    );
                }
            } else {
                const diffs: Array<{ field: string; oldValue: any; newValue: any }> = [];

                if (targetFlag.enabled !== sourceFlag.enabled) {
                    diffs.push({ field: 'enabled', oldValue: targetFlag.enabled, newValue: sourceFlag.enabled });
                }
                if (targetFlag.strategyType !== sourceFlag.strategyType) {
                    diffs.push({ field: 'strategyType', oldValue: targetFlag.strategyType, newValue: sourceFlag.strategyType });
                }
                if (JSON.stringify(targetFlag.strategyConfig) !== JSON.stringify(sourceFlag.strategyConfig)) {
                    diffs.push({ field: 'strategyConfig', oldValue: targetFlag.strategyConfig, newValue: sourceFlag.strategyConfig });
                }

                if (diffs.length > 0) {
                    result.stats.flagsUpdated++;
                    result.changes.push({
                        featureKey: feature.key,
                        action: 'UPDATE',
                        diff: diffs,
                    });

                    if (!dto.dryRun) {
                        await this.updateFlag(
                            tenantId,
                            feature.id,
                            dto.targetEnv,
                            {
                                enabled: sourceFlag.enabled,
                                strategyType: sourceFlag.strategyType,
                                strategyConfig: sourceFlag.strategyConfig as any,
                            },
                            actorId
                        );
                    }
                } else {
                    result.stats.flagsSkipped++;
                    result.changes.push({
                        featureKey: feature.key,
                        action: 'SKIP',
                        diff: [],
                    });
                }
            }
        }

        return result;
    }

    private validateStrategyConfig(
        type: StrategyType,
        config: unknown,
    ): void {
        if (type === StrategyType.BOOLEAN) {
            return; // No config needed
        }

        if (type === StrategyType.PERCENTAGE) {
            const cfg = config as PercentageConfig;
            if (!cfg || typeof cfg.percentage !== 'number') {
                throw new BadRequestException('Percentage strategy requires { percentage: number }');
            }
            if (cfg.percentage < 0 || cfg.percentage > 100) {
                throw new BadRequestException('Percentage must be between 0 and 100');
            }
        }

        if (type === StrategyType.USER_TARGETING) {
            const cfg = config as UserTargetingConfig;
            if (!cfg || !Array.isArray(cfg.rules)) {
                throw new BadRequestException('User targeting strategy requires { rules: [], defaultValue: boolean }');
            }
        }
    }
}
