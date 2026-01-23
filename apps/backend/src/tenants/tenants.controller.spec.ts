import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('TenantsController', () => {
    let controller: TenantsController;
    let service: DeepMockProxy<TenantsService>;

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
            controllers: [TenantsController],
            providers: [
                { provide: TenantsService, useValue: mockDeep<TenantsService>() },
            ],
        }).compile();

        controller = module.get<TenantsController>(TenantsController);
        service = module.get(TenantsService);
    });

    describe('create', () => {
        it('should create a tenant', async () => {
            service.create.mockResolvedValue(mockTenant);

            const result = await controller.create({ name: 'Test', slug: 'test' });

            expect(result).toEqual(mockTenant);
        });
    });

    describe('findAll', () => {
        it('should return all tenants', async () => {
            service.findAll.mockResolvedValue([mockTenant]);

            const result = await controller.findAll();

            expect(result).toEqual([mockTenant]);
        });
    });

    describe('findOne', () => {
        it('should return a tenant by id', async () => {
            service.findOne.mockResolvedValue(mockTenant);

            const result = await controller.findOne('tenant-1');

            expect(result).toEqual(mockTenant);
        });
    });

    describe('update', () => {
        it('should update a tenant', async () => {
            const updated = { ...mockTenant, name: 'Updated' };
            service.update.mockResolvedValue(updated);

            const result = await controller.update('tenant-1', { name: 'Updated' });

            expect(result).toEqual(updated);
        });
    });

    describe('remove', () => {
        it('should delete a tenant', async () => {
            service.remove.mockResolvedValue();

            await controller.remove('tenant-1');

            expect(service.remove).toHaveBeenCalledWith('tenant-1');
        });
    });
});
