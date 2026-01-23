import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

interface TenantQuotas {
    quotaBurst: number;     // Requests per second
    quotaSustained: number; // Requests per minute
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
    private quotaCache = new Map<string, { quotas: TenantQuotas; expiresAt: number }>();
    private readonly CACHE_TTL_MS = 60000;

    constructor(
        private readonly redisService: RedisService,
        private readonly prisma: PrismaService,
    ) { }

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<unknown>> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        const tenantId = (request.user as { tenantId?: string })?.tenantId
            || request.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return next.handle();
        }

        const quotas = await this.getTenantQuotas(tenantId);
        if (!quotas) {
            return next.handle();
        }

        const burstKey = `ratelimit:burst:${tenantId}`;
        const burstResult = await this.redisService.checkRateLimit(
            burstKey,
            quotas.quotaBurst,
            1, // 1 second window
        );

        const sustainedKey = `ratelimit:sustained:${tenantId}`;
        const sustainedResult = await this.redisService.checkRateLimit(
            sustainedKey,
            quotas.quotaSustained,
            60, // 60 second window
        );

        response.setHeader('X-RateLimit-Limit-Burst', quotas.quotaBurst);
        response.setHeader('X-RateLimit-Remaining-Burst', burstResult.remaining);
        response.setHeader('X-RateLimit-Limit-Sustained', quotas.quotaSustained);
        response.setHeader('X-RateLimit-Remaining-Sustained', sustainedResult.remaining);
        response.setHeader('X-RateLimit-Reset', Math.max(burstResult.resetAt, sustainedResult.resetAt));

        if (!burstResult.allowed) {
            response.setHeader('Retry-After', '1');
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Burst rate limit exceeded. Please slow down.',
                    retryAfter: 1,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        if (!sustainedResult.allowed) {
            const retryAfter = Math.ceil((sustainedResult.resetAt * 1000 - Date.now()) / 1000);
            response.setHeader('Retry-After', retryAfter);
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Sustained rate limit exceeded. Please try again later.',
                    retryAfter,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return next.handle();
    }

    private async getTenantQuotas(tenantId: string): Promise<TenantQuotas | null> {
        const now = Date.now();
        const cached = this.quotaCache.get(tenantId);

        if (cached && cached.expiresAt > now) {
            return cached.quotas;
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { quotaBurst: true, quotaSustained: true },
        });

        if (!tenant) {
            return null;
        }

        this.quotaCache.set(tenantId, {
            quotas: tenant,
            expiresAt: now + this.CACHE_TTL_MS,
        });

        return tenant;
    }
}
