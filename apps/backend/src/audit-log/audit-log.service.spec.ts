import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuditAction, ActorType } from '@prisma/client';

describe('AuditLogService', () => {
    let service: AuditLogService;
    let prisma: DeepMockProxy<PrismaService>;

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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditLogService,
                { provide: PrismaService, useValue: mockDeep<PrismaService>() },
            ],
        }).compile();

        service = module.get<AuditLogService>(AuditLogService);
        prisma = module.get(PrismaService);
    });

    describe('create', () => {
        it('should create an audit log entry', async () => {
            prisma.auditLog.create.mockResolvedValue(mockAuditLog);

            const params = {
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
            };

            const result = await service.create(params);

            expect(result).toEqual(mockAuditLog);
            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    tenantId: 'tenant-1',
                    action: AuditAction.CREATE,
                }),
            });
        });
    });

    describe('findAll', () => {
        it('should return paginated audit logs', async () => {
            prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
            prisma.auditLog.count.mockResolvedValue(1);

            const result = await service.findAll('tenant-1', {});

            expect(result).toEqual({
                data: [mockAuditLog],
                total: 1,
                page: 1,
                limit: 20,
            });
        });

        it('should apply pagination parameters', async () => {
            prisma.auditLog.findMany.mockResolvedValue([]);
            prisma.auditLog.count.mockResolvedValue(0);

            await service.findAll('tenant-1', { page: 2, limit: 10 });

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10,
                })
            );
        });

        it('should filter by action', async () => {
            prisma.auditLog.findMany.mockResolvedValue([]);
            prisma.auditLog.count.mockResolvedValue(0);

            await service.findAll('tenant-1', { action: AuditAction.UPDATE });

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ action: AuditAction.UPDATE }),
                })
            );
        });

        it('should filter by entityType', async () => {
            prisma.auditLog.findMany.mockResolvedValue([]);
            prisma.auditLog.count.mockResolvedValue(0);

            await service.findAll('tenant-1', { entityType: 'Feature' });

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ entityType: 'Feature' }),
                })
            );
        });

        it('should filter by entityId', async () => {
            prisma.auditLog.findMany.mockResolvedValue([]);
            prisma.auditLog.count.mockResolvedValue(0);

            await service.findAll('tenant-1', { entityId: 'feature-1' });

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ entityId: 'feature-1' }),
                })
            );
        });

        it('should filter by actorId', async () => {
            prisma.auditLog.findMany.mockResolvedValue([]);
            prisma.auditLog.count.mockResolvedValue(0);

            await service.findAll('tenant-1', { actorId: 'user-1' });

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ actorId: 'user-1' }),
                })
            );
        });
    });

    describe('findByEntity', () => {
        it('should return audit logs for specific entity', async () => {
            prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);

            const result = await service.findByEntity('tenant-1', 'Feature', 'feature-1');

            expect(result).toEqual([mockAuditLog]);
            expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    tenantId: 'tenant-1',
                    entityType: 'Feature',
                    entityId: 'feature-1',
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
        });
    });
});
