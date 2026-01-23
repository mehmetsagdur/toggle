import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuditAction, ActorType } from '@prisma/client';

describe('AuditLogController', () => {
    let controller: AuditLogController;
    let service: DeepMockProxy<AuditLogService>;

    const mockAuditLog = {
        id: 'audit-1',
        tenantId: 'tenant-1',
        actorId: 'user-1',
        actorType: ActorType.USER,
        action: AuditAction.CREATE,
        entityType: 'Feature',
        entityId: 'feature-1',
        beforeState: null,
        afterState: { key: 'test' },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        createdAt: new Date('2025-01-01'),
    };

    const mockUser = {
        userId: 'user-1',
        tenantId: 'tenant-1',
        email: 'test@example.com',
        role: 'admin' as const,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuditLogController],
            providers: [
                { provide: AuditLogService, useValue: mockDeep<AuditLogService>() },
            ],
        }).compile();

        controller = module.get<AuditLogController>(AuditLogController);
        service = module.get(AuditLogService);
    });

    describe('findAll', () => {
        it('should return paginated audit logs', async () => {
            const response = { data: [mockAuditLog], total: 1, page: 1, limit: 20 };
            service.findAll.mockResolvedValue(response);

            const result = await controller.findAll(mockUser, {});

            expect(result).toEqual(response);
            expect(service.findAll).toHaveBeenCalledWith('tenant-1', {});
        });
    });

    describe('findByEntity', () => {
        it('should return audit logs for entity', async () => {
            service.findByEntity.mockResolvedValue([mockAuditLog]);

            const result = await controller.findByEntity(mockUser, 'Feature', 'feature-1');

            expect(result).toEqual([mockAuditLog]);
            expect(service.findByEntity).toHaveBeenCalledWith('tenant-1', 'Feature', 'feature-1');
        });
    });
});
