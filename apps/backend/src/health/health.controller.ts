import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
        database: 'up' | 'down';
    };
}

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Public()
    @Get()
    async check(): Promise<HealthStatus> {
        let databaseStatus: 'up' | 'down' = 'down';

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            databaseStatus = 'up';
        } catch {
            databaseStatus = 'down';
        }

        const isHealthy = databaseStatus === 'up';

        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: databaseStatus,
            },
        };
    }
}
