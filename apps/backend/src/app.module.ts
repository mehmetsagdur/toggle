import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ObservabilityModule } from './observability/observability.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { FeaturesModule } from './features/features.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { CacheModule } from './cache/cache.module';
import { StatsModule } from './stats/stats.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { EtagInterceptor } from './common/interceptors/etag.interceptor';
import { RedisService } from './redis/redis.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
        RedisModule,
        AuthModule,
        HealthModule,
        TenantsModule,
        FeaturesModule,
        AuditLogModule,
        CacheModule,
        StatsModule,
        ObservabilityModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useFactory: (redisService: RedisService, prismaService: PrismaService) => {
                return new RateLimitInterceptor(redisService, prismaService);
            },
            inject: [RedisService, PrismaService],
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: EtagInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes('*');
    }
}
