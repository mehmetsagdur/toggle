import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { of } from 'rxjs';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('RateLimitInterceptor', () => {
    let interceptor: RateLimitInterceptor;
    let redisService: DeepMockProxy<RedisService>;
    let prisma: DeepMockProxy<PrismaService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RateLimitInterceptor,
                { provide: RedisService, useValue: mockDeep<RedisService>() },
                { provide: PrismaService, useValue: mockDeep<PrismaService>() },
            ],
        }).compile();

        interceptor = module.get<RateLimitInterceptor>(RateLimitInterceptor);
        redisService = module.get(RedisService);
        prisma = module.get(PrismaService);
    });

    const createMockContext = (tenantId?: string, headerTenantId?: string) => {
        const mockRequest = {
            user: tenantId ? { tenantId } : undefined,
            headers: { 'x-tenant-id': headerTenantId },
        };

        const mockResponse = {
            setHeader: jest.fn(),
        };

        return {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            }),
        } as unknown as ExecutionContext;
    };

    const createMockHandler = (): CallHandler => ({
        handle: () => of('response'),
    });

    describe('intercept', () => {
        it('should skip rate limiting if no tenant ID', async () => {
            const context = createMockContext();
            const handler = createMockHandler();

            const result = await interceptor.intercept(context, handler);

            expect(result).toBeDefined();
            expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
        });

        it('should use x-tenant-id header if user not authenticated', async () => {
            const context = createMockContext(undefined, 'header-tenant');
            const handler = createMockHandler();

            prisma.tenant.findUnique.mockResolvedValue({
                id: 'header-tenant',
                name: 'Test',
                slug: 'test',
                quotaBurst: 10,
                quotaSustained: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            redisService.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 5,
                resetAt: Date.now() + 1000,
            });

            const result = await interceptor.intercept(context, handler);

            expect(result).toBeDefined();
            expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
                where: { id: 'header-tenant' },
                select: { quotaBurst: true, quotaSustained: true },
            });
        });

        it('should skip if tenant not found', async () => {
            const context = createMockContext('tenant-1');
            const handler = createMockHandler();

            prisma.tenant.findUnique.mockResolvedValue(null);

            const result = await interceptor.intercept(context, handler);

            expect(result).toBeDefined();
        });

        it('should throw 429 when burst limit exceeded', async () => {
            const context = createMockContext('tenant-1');
            const handler = createMockHandler();

            prisma.tenant.findUnique.mockResolvedValue({
                id: 'tenant-1',
                name: 'Test',
                slug: 'test',
                quotaBurst: 10,
                quotaSustained: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            redisService.checkRateLimit
                .mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 1000 })
                .mockResolvedValueOnce({ allowed: true, remaining: 50, resetAt: Date.now() + 60000 });

            await expect(interceptor.intercept(context, handler))
                .rejects.toThrow(HttpException);

            const response = context.switchToHttp().getResponse();
            expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '1');
        });

        it('should throw 429 when sustained limit exceeded', async () => {
            const context = createMockContext('tenant-1');
            const handler = createMockHandler();

            prisma.tenant.findUnique.mockResolvedValue({
                id: 'tenant-1',
                name: 'Test',
                slug: 'test',
                quotaBurst: 10,
                quotaSustained: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            redisService.checkRateLimit
                .mockResolvedValueOnce({ allowed: true, remaining: 5, resetAt: Date.now() + 1000 })
                .mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Math.ceil(Date.now() / 1000) + 30 });

            await expect(interceptor.intercept(context, handler))
                .rejects.toThrow(HttpException);
        });

        it('should set rate limit headers on success', async () => {
            const context = createMockContext('tenant-1');
            const handler = createMockHandler();

            prisma.tenant.findUnique.mockResolvedValue({
                id: 'tenant-1',
                name: 'Test',
                slug: 'test',
                quotaBurst: 10,
                quotaSustained: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            redisService.checkRateLimit
                .mockResolvedValueOnce({ allowed: true, remaining: 5, resetAt: 1000 })
                .mockResolvedValueOnce({ allowed: true, remaining: 50, resetAt: 2000 });

            await interceptor.intercept(context, handler);

            const response = context.switchToHttp().getResponse();
            expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit-Burst', 10);
            expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining-Burst', 5);
            expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit-Sustained', 100);
            expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining-Sustained', 50);
        });

        it('should use cached quotas for subsequent requests', async () => {
            const context = createMockContext('tenant-1');
            const handler = createMockHandler();

            prisma.tenant.findUnique.mockResolvedValue({
                id: 'tenant-1',
                name: 'Test',
                slug: 'test',
                quotaBurst: 10,
                quotaSustained: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            redisService.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 5,
                resetAt: 1000,
            });

            await interceptor.intercept(context, handler);
            await interceptor.intercept(context, handler);

            expect(prisma.tenant.findUnique).toHaveBeenCalledTimes(1);
        });
    });
});
