import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
    let service: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PrismaService],
        }).compile();

        service = module.get<PrismaService>(PrismaService);

        jest.spyOn(service, '$connect').mockResolvedValue();
        jest.spyOn(service, '$disconnect').mockResolvedValue();
        jest.spyOn(service, '$transaction').mockImplementation(async (fn: any) => fn(service));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('onModuleInit', () => {
        it('should connect to database', async () => {
            await service.onModuleInit();

            expect(service.$connect).toHaveBeenCalled();
        });
    });

    describe('onModuleDestroy', () => {
        it('should disconnect from database', async () => {
            await service.onModuleDestroy();

            expect(service.$disconnect).toHaveBeenCalled();
        });
    });

    describe('executeWithTenant', () => {
        it('should execute operation within tenant context', async () => {
            const mockTenant = { id: 'tenant-1' };
            // @ts-expect-error - Mocking nested Prisma client
            service.tenant = {
                findUnique: jest.fn().mockResolvedValue(mockTenant),
            };

            const operation = jest.fn().mockResolvedValue('result');

            const result = await service.executeWithTenant('tenant-1', operation);

            expect(result).toBe('result');
            expect(operation).toHaveBeenCalled();
        });

        it('should throw error if tenant not found', async () => {
            // @ts-expect-error - Mocking nested Prisma client
            service.tenant = {
                findUnique: jest.fn().mockResolvedValue(null),
            };

            const operation = jest.fn();

            await expect(service.executeWithTenant('not-exist', operation))
                .rejects.toThrow('Tenant not found: not-exist');
            expect(operation).not.toHaveBeenCalled();
        });
    });
});
