import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('HealthController', () => {
    let controller: HealthController;
    let prisma: DeepMockProxy<PrismaService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                { provide: PrismaService, useValue: mockDeep<PrismaService>() },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        prisma = module.get(PrismaService);
    });

    describe('check', () => {
        it('should return healthy status when database is up', async () => {
            prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

            const result = await controller.check();

            expect(result.status).toBe('healthy');
            expect(result.services.database).toBe('up');
            expect(result.timestamp).toBeDefined();
        });

        it('should return unhealthy status when database is down', async () => {
            prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

            const result = await controller.check();

            expect(result.status).toBe('unhealthy');
            expect(result.services.database).toBe('down');
        });
    });
});
