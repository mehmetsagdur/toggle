import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService, AuthenticatedUser } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: jest.Mocked<JwtService>;

    beforeEach(async () => {
        const mockJwtService = {
            sign: jest.fn(),
            verify: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get(JwtService);
    });

    describe('generateToken', () => {
        it('should generate a JWT token with correct payload', () => {
            const user: AuthenticatedUser = {
                userId: 'user-123',
                tenantId: 'tenant-456',
                email: 'test@example.com',
                role: 'admin',
            };
            jwtService.sign.mockReturnValue('mock-jwt-token');

            const result = service.generateToken(user);

            expect(result).toBe('mock-jwt-token');
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: 'user-123',
                tenantId: 'tenant-456',
                email: 'test@example.com',
                role: 'admin',
            });
        });
    });

    describe('verifyToken', () => {
        it('should return payload for valid token', () => {
            const payload = {
                sub: 'user-123',
                tenantId: 'tenant-456',
                email: 'test@example.com',
                role: 'admin' as const,
            };
            jwtService.verify.mockReturnValue(payload);

            const result = service.verifyToken('valid-token');

            expect(result).toEqual(payload);
            expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
        });

        it('should return null for invalid token', () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = service.verifyToken('invalid-token');

            expect(result).toBeNull();
        });
    });

    describe('hashPassword', () => {
        it('should hash password with bcrypt', async () => {
            const password = 'securePassword123';

            const hash = await service.hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password', async () => {
            const password = 'securePassword123';
            const hash = await service.hashPassword(password);

            const result = await service.comparePassword(password, hash);

            expect(result).toBe(true);
        });

        it('should return false for non-matching password', async () => {
            const password = 'securePassword123';
            const hash = await service.hashPassword(password);

            const result = await service.comparePassword('wrongPassword', hash);

            expect(result).toBe(false);
        });
    });

    describe('generateDemoToken', () => {
        it('should generate demo token for testing', () => {
            jwtService.sign.mockReturnValue('demo-token');

            const result = service.generateDemoToken('tenant-123');

            expect(result).toBe('demo-token');
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: 'demo-user',
                tenantId: 'tenant-123',
                email: 'demo@example.com',
                role: 'admin',
            });
        });
    });
});
