import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [PrismaModule, RedisModule],
    controllers: [StatsController],
})
export class StatsModule { }
