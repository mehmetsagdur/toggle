import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('TenantsService', () => {
    let service: TenantsService;
    let prisma: DeepMockProxy<PrismaService>;

    const mockTenant = {
        id: 'tenant-1',
        name: 'Test Tenant',
        slug: 'test-tenant',
        quotaBurst: 100,
        quotaSustained: 1000,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantsService,
                { provide: PrismaService, useValue: mockDeep<PrismaService>() },
            ],
        }).compile();

        service = module.get<TenantsService>(TenantsService);
        prisma = module.get(PrismaService);
    });

    describe('create', () => {
        it('should create a tenant with default quotas', async () => {
            const dto = { name: 'New Tenant', slug: 'new-tenant' };
            prisma.tenant.create.mockResolvedValue({ ...mockTenant, ...dto });

            const result = await service.create(dto);

            expect(result.name).toBe('New Tenant');
            expect(prisma.tenant.create).toHaveBeenCalledWith({
                data: {
                    name: 'New Tenant',
                    slug: 'new-tenant',
                    quotaBurst: 100,
                    quotaSustained: 1000,
                },
            });
        });

        it('should create a tenant with custom quotas', async () => {
            const dto = { name: 'Pro Tenant', slug: 'pro', quotaBurst: 500, quotaSustained: 5000 };
            prisma.tenant.create.mockResolvedValue({ ...mockTenant, ...dto });

            const result = await service.create(dto);

            expect(result.quotaBurst).toBe(500);
            expect(prisma.tenant.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ quotaBurst: 500, quotaSustained: 5000 }),
            });
        });

        it('should throw ConflictException on duplicate slug', async () => {
            prisma.tenant.create.mockRejectedValue(
                new Prisma.PrismaClientKnownRequestError('', { code: 'P2002', clientVersion: '1' })
            );

            await expect(service.create({ name: 'Dup', slug: 'existing' }))
                .rejects.toThrow(ConflictException);
        });

        it('should rethrow other errors', async () => {
            prisma.tenant.create.mockRejectedValue(new Error('DB error'));

            await expect(service.create({ name: 'Test', slug: 'test' }))
                .rejects.toThrow('DB error');
        });
    });

    describe('findAll', () => {
        it('should return all tenants ordered by createdAt desc', async () => {
            prisma.tenant.findMany.mockResolvedValue([mockTenant]);

            const result = await service.findAll();

            expect(result).toEqual([mockTenant]);
            expect(prisma.tenant.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('findOne', () => {
        it('should return tenant by id', async () => {
            prisma.tenant.findUnique.mockResolvedValue(mockTenant);

            const result = await service.findOne('tenant-1');

            expect(result).toEqual(mockTenant);
        });

        it('should throw NotFoundException if tenant not found', async () => {
            prisma.tenant.findUnique.mockResolvedValue(null);

            await expect(service.findOne('not-exist'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('findBySlug', () => {
        it('should return tenant by slug', async () => {
            prisma.tenant.findUnique.mockResolvedValue(mockTenant);

            const result = await service.findBySlug('test-tenant');

            expect(result).toEqual(mockTenant);
        });

        it('should throw NotFoundException if slug not found', async () => {
            prisma.tenant.findUnique.mockResolvedValue(null);

            await expect(service.findBySlug('not-exist'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update tenant', async () => {
            const updated = { ...mockTenant, name: 'Updated Name' };
            prisma.tenant.findUnique.mockResolvedValue(mockTenant);
            prisma.tenant.update.mockResolvedValue(updated);

            const result = await service.update('tenant-1', { name: 'Updated Name' });

            expect(result.name).toBe('Updated Name');
            expect(prisma.tenant.update).toHaveBeenCalledWith({
                where: { id: 'tenant-1' },
                data: { name: 'Updated Name' },
            });
        });

        it('should throw NotFoundException if tenant not found', async () => {
            prisma.tenant.findUnique.mockResolvedValue(null);

            await expect(service.update('not-exist', { name: 'New' }))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete tenant', async () => {
            prisma.tenant.findUnique.mockResolvedValue(mockTenant);

            await service.remove('tenant-1');

            expect(prisma.tenant.delete).toHaveBeenCalledWith({
                where: { id: 'tenant-1' },
            });
        });

        it('should throw NotFoundException if tenant not found', async () => {
            prisma.tenant.findUnique.mockResolvedValue(null);

            await expect(service.remove('not-exist'))
                .rejects.toThrow(NotFoundException);
        });
    });
});
