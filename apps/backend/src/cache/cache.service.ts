import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { FeatureFlagResponseDto, FeatureResponseDto } from '../features/dto';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly FIND_TTL = 300; // 5 minutes

    constructor(private readonly redis: RedisService) { }

    // Key generators
    private getFlagKey(tenantId: string, featureId: string, env: string): string {
        return `flag:${tenantId}:${featureId}:${env}`;
    }

    private getFeaturesKey(tenantId: string): string {
        return `features:${tenantId}`;
    }

    async getFlag(tenantId: string, featureId: string, env: string): Promise<FeatureFlagResponseDto | null> {
        const key = this.getFlagKey(tenantId, featureId, env);
        const cached = await this.redis.get(key);
        if (cached) {
            this.logger.debug(`Cache HIT: ${key}`);
            return JSON.parse(cached);
        }
        this.logger.debug(`Cache MISS: ${key}`);
        return null;
    }

    async setFlag(tenantId: string, featureId: string, env: string, flag: FeatureFlagResponseDto): Promise<void> {
        const key = this.getFlagKey(tenantId, featureId, env);
        await this.redis.set(key, JSON.stringify(flag), this.FIND_TTL);
    }

    async invalidateFlag(tenantId: string, featureId: string, env: string): Promise<void> {
        const key = this.getFlagKey(tenantId, featureId, env);
        await this.redis.del(key);
        this.logger.debug(`Invalidated: ${key}`);
    }

    async getFeatures(tenantId: string): Promise<FeatureResponseDto[] | null> {
        const key = this.getFeaturesKey(tenantId);
        const cached = await this.redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    }

    async setFeatures(tenantId: string, features: FeatureResponseDto[]): Promise<void> {
        const key = this.getFeaturesKey(tenantId);
        await this.redis.set(key, JSON.stringify(features), this.FIND_TTL);
    }

    async invalidateFeatures(tenantId: string): Promise<void> {
        const key = this.getFeaturesKey(tenantId);
        await this.redis.del(key);
        this.logger.debug(`Invalidated: ${key}`);
    }

    async invalidateFeatureAll(tenantId: string, _featureId: string): Promise<void> {
        await this.invalidateFeatures(tenantId);
    }
}
