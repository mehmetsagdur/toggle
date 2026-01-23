import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: jest.Mocked<Reflector>;

    beforeEach(async () => {
        reflector = {
            getAllAndOverride: jest.fn(),
        } as unknown as jest.Mocked<Reflector>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtAuthGuard,
                { provide: Reflector, useValue: reflector },
            ],
        }).compile();

        guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    });

    const createMockContext = (url: string) => {
        return {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({ url }),
            }),
        } as unknown as ExecutionContext;
    };

    describe('canActivate', () => {
        it('should return true for public routes', () => {
            const context = createMockContext('/api/health');
            reflector.getAllAndOverride.mockReturnValue(true);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
            expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
        });

        it('should return true for /metrics endpoint', () => {
            const context = createMockContext('/metrics');
            reflector.getAllAndOverride.mockReturnValue(false);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should return true for /api/docs endpoint', () => {
            const context = createMockContext('/api/docs');
            reflector.getAllAndOverride.mockReturnValue(false);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should return true for /api/docs-json endpoint', () => {
            const context = createMockContext('/api/docs-json');
            reflector.getAllAndOverride.mockReturnValue(false);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });
    });

    describe('handleRequest', () => {
        it('should return user when valid', () => {
            const user = { userId: '1', tenantId: 't1' };

            const result = guard.handleRequest(null, user, undefined);

            expect(result).toEqual(user);
        });

        it('should throw UnauthorizedException when error provided', () => {
            const error = new Error('Token expired');

            expect(() => guard.handleRequest(error, false, undefined))
                .toThrow(error);
        });

        it('should throw UnauthorizedException when no user', () => {
            expect(() => guard.handleRequest(null, false, undefined))
                .toThrow(UnauthorizedException);
        });

        it('should include info message when provided', () => {
            const info = new Error('Invalid signature');

            expect(() => guard.handleRequest(null, false, info))
                .toThrow(new UnauthorizedException('Invalid signature'));
        });
    });
});
