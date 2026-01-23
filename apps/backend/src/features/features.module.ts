import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CacheModule } from '../cache/cache.module';

@Module({
    imports: [AuditLogModule, CacheModule],
    controllers: [FeaturesController],
    providers: [FeaturesService],
    exports: [FeaturesService],
})
export class FeaturesModule { }
