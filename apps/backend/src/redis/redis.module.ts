
import { Module, Global } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
                return new Redis(redisUrl, {
                    maxRetriesPerRequest: 3,
                    retryStrategy: (times: number) => {
                        if (times > 3) return null;
                        return Math.min(times * 100, 3000);
                    },
                });
            },
        },
        RedisService,
    ],
    exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule { }
