import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TenantsService } from '../tenants/tenants.service';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<AuthService>;
    let tenantsService: jest.Mocked<TenantsService>;

    beforeEach(async () => {
        const mockAuthService = {
            generateDemoToken: jest.fn(),
            verifyToken: jest.fn(),
        };

        const mockTenantsService = {
            findBySlug: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: TenantsService, useValue: mockTenantsService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get(AuthService);
        tenantsService = module.get(TenantsService);
    });

    describe('generateDemoToken', () => {
        it('should resolve tenant slug and generate token', async () => {
            const mockTenant = { id: 'tenant-id-123', name: 'Acme', slug: 'acme-corp', quotaBurst: 100, quotaSustained: 1000, createdAt: new Date(), updatedAt: new Date() };
            tenantsService.findBySlug.mockResolvedValue(mockTenant);
            authService.generateDemoToken.mockReturnValue('demo-jwt-token');

            const result = await controller.generateDemoToken({ tenantSlug: 'acme-corp' });

            expect(result).toEqual({ token: 'demo-jwt-token', tenantId: 'tenant-id-123' });
            expect(tenantsService.findBySlug).toHaveBeenCalledWith('acme-corp');
            expect(authService.generateDemoToken).toHaveBeenCalledWith('tenant-id-123');
        });
    });

    describe('getProfile', () => {
        it('should return the authenticated user', () => {
            const user = {
                userId: 'user-1',
                tenantId: 'tenant-1',
                email: 'test@example.com',
                role: 'admin' as const,
            };

            const result = controller.getProfile(user);

            expect(result).toEqual(user);
        });
    });

    describe('verifyToken', () => {
        it('should return valid true with payload for valid token', () => {
            const payload = { sub: 'user-1', tenantId: 'tenant-1', email: 'test@test.com', role: 'admin' as const };
            authService.verifyToken.mockReturnValue(payload);

            const result = controller.verifyToken('valid-token');

            expect(result).toEqual({ valid: true, payload });
        });

        it('should return valid false for invalid token', () => {
            authService.verifyToken.mockReturnValue(null);

            const result = controller.verifyToken('invalid-token');

            expect(result).toEqual({ valid: false });
        });
    });
});
