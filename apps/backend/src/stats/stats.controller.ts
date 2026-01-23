import { Controller, Get, Headers } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface StatsResponse {
    features: {
        total: number;
        byEnvironment: Record<string, number>;
        byStrategy: Record<string, number>;
    };
    flags: {
        total: number;
        enabled: number;
        disabled: number;
    };
    auditLogs: {
        total: number;
        last24h: number;
        byAction: Record<string, number>;
    };
    cache: {
        status: string;
        keys?: number;
    };
}

@Controller('stats')
export class StatsController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) { }

    @Get()
    async getStats(@Headers('x-tenant-id') tenantId: string): Promise<StatsResponse> {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            featuresCount,
            flagsData,
            auditLogsTotal,
            auditLogs24h,
            auditLogsByAction,
        ] = await Promise.all([
            this.prisma.feature.count({ where: { tenantId } }),

            this.prisma.featureFlag.findMany({
                where: { tenantId },
                select: { env: true, enabled: true, strategyType: true },
            }),

            this.prisma.auditLog.count({ where: { tenantId } }),

            this.prisma.auditLog.count({
                where: { tenantId, createdAt: { gte: last24h } },
            }),

            this.prisma.auditLog.groupBy({
                by: ['action'],
                where: { tenantId },
                _count: { action: true },
            }),
        ]);

        const byEnvironment: Record<string, number> = {};
        const byStrategy: Record<string, number> = {};
        let enabledCount = 0;

        for (const flag of flagsData) {
            byEnvironment[flag.env] = (byEnvironment[flag.env] || 0) + 1;

            byStrategy[flag.strategyType] = (byStrategy[flag.strategyType] || 0) + 1;
            if (flag.enabled) enabledCount++;
        }

        const byAction: Record<string, number> = {};
        for (const log of auditLogsByAction) {
            byAction[log.action] = log._count.action;
        }

        let cacheStatus = 'disconnected';
        let cacheKeys = 0;
        try {
            await this.redis.get('health:ping');
            cacheStatus = 'connected';
            cacheKeys = flagsData.length;
        } catch {
            cacheStatus = 'error';
        }

        return {
            features: {
                total: featuresCount,
                byEnvironment,
                byStrategy,
            },
            flags: {
                total: flagsData.length,
                enabled: enabledCount,
                disabled: flagsData.length - enabledCount,
            },
            auditLogs: {
                total: auditLogsTotal,
                last24h: auditLogs24h,
                byAction,
            },
            cache: {
                status: cacheStatus,
                keys: cacheKeys,
            },
        };
    }
}
