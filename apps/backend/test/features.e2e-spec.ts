import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { FeaturesModule } from '../src/features/features.module';
import { FeaturesService } from '../src/features/features.service';
import { RedisService } from '../src/redis/redis.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { CacheService } from '../src/cache/cache.service';
import { AuditLogService } from '../src/audit-log/audit-log.service';
import { mockDeep } from 'jest-mock-extended';
import { createFeature, createFeatureFlag, createTenant } from './fixtures';

// Custom mock guard that always allows access and sets user
class MockJwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        request.user = { userId: 'test-user', email: 'test@acme.com', roles: [] };
        return true;
    }
}

describe('FeaturesController (e2e)', () => {
    let app: INestApplication;
    const featuresService = mockDeep<FeaturesService>();
    const redisService = mockDeep<RedisService>();
    const prismaService = mockDeep<PrismaService>();
    const cacheService = mockDeep<CacheService>();
    const auditLogService = mockDeep<AuditLogService>();

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [FeaturesModule],
        })
            .overrideProvider(FeaturesService)
            .useValue(featuresService)
            .overrideProvider(RedisService)
            .useValue(redisService)
            .overrideProvider(PrismaService)
            .useValue(prismaService)
            .overrideProvider(CacheService)
            .useValue(cacheService)
            .overrideProvider(AuditLogService)
            .useValue(auditLogService)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        // Apply mock guard globally to inject user into request
        app.useGlobalGuards(new MockJwtAuthGuard());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        prismaService.tenant.findUnique.mockResolvedValue(createTenant());
    });

    describe('/features (POST)', () => {
        it('should create feature', () => {
            const feature = createFeature();
            featuresService.createFeature.mockResolvedValue(feature);

            return request(app.getHttpServer())
                .post('/features')
                .set('x-tenant-id', feature.tenantId)
                .send({ key: 'new_feature', name: 'New Feature' })
                .expect(201)
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(feature.id);
                    expect(featuresService.createFeature).toHaveBeenCalled();
                });
        });
    });

    describe('/features (GET)', () => {
        it('should list features with pagination', () => {
            const feature = createFeature();
            featuresService.findAllFeatures.mockResolvedValue({
                data: [feature],
                total: 1,
                page: 1,
                limit: 20,
            });

            return request(app.getHttpServer())
                .get('/features')
                .set('x-tenant-id', feature.tenantId)
                .expect(200)
                .expect((res: request.Response) => {
                    expect(res.body.data).toHaveLength(1);
                    expect(res.body.total).toBe(1);
                });
        });
    });

    describe('/features/:id (GET)', () => {
        it('should return single feature', () => {
            const feature = createFeature();
            featuresService.findOneFeature.mockResolvedValue(feature);

            return request(app.getHttpServer())
                .get(`/features/${feature.id}`)
                .set('x-tenant-id', feature.tenantId)
                .expect(200)
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(feature.id);
                });
        });
    });

    describe('/features/:featureId/flags (POST)', () => {
        it('should create flag', () => {
            const flag = createFeatureFlag();
            featuresService.createFlag.mockResolvedValue(flag);

            return request(app.getHttpServer())
                .post(`/features/${flag.featureId}/flags`)
                .set('x-tenant-id', flag.tenantId)
                .send({
                    env: flag.env,
                    enabled: true,
                    strategyType: 'BOOLEAN',
                })
                .expect(201)
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(flag.id);
                });
        });
    });
});

