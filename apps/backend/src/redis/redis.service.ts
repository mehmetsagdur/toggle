import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

    async onModuleDestroy(): Promise<void> {
        this.logger.log('Disconnecting from Redis...');
        await this.redis.quit();
    }

    async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.redis.setex(key, ttlSeconds, value);
        } else {
            await this.redis.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async incr(key: string): Promise<number> {
        return this.redis.incr(key);
    }

    async expire(key: string, seconds: number): Promise<void> {
        await this.redis.expire(key, seconds);
    }

    async ttl(key: string): Promise<number> {
        return this.redis.ttl(key);
    }

    async checkRateLimit(
        key: string,
        limit: number,
        windowSeconds: number,
    ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
        const now = Date.now();
        const windowStart = now - windowSeconds * 1000;

        // Use a sorted set for sliding window
        const multi = this.redis.multi();

        // Remove old entries
        multi.zremrangebyscore(key, 0, windowStart);
        // Add current request
        multi.zadd(key, now, `${now}-${Math.random()}`);
        // Count requests in window
        multi.zcard(key);
        // Set expiry
        multi.expire(key, windowSeconds);

        const results = await multi.exec();

        // zcard result is at index 2
        const count = results?.[2]?.[1] as number || 0;
        const allowed = count <= limit;
        const remaining = Math.max(0, limit - count);
        const resetAt = Math.ceil((now + windowSeconds * 1000) / 1000);

        return { allowed, remaining, resetAt };
    }
}
