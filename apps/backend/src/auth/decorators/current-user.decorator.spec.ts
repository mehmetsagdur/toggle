import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
    function getParamDecoratorFactory(decorator: () => ParameterDecorator) {
        class Test {
            public test(@decorator() value: unknown) {
                return value;
            }
        }

        const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
        return args[Object.keys(args)[0]].factory;
    }

    const createMockContext = (user: Record<string, unknown> | undefined) => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
        } as unknown as ExecutionContext;
    };

    it('should return full user object when no property specified', () => {
        const user = {
            userId: 'user-1',
            tenantId: 'tenant-1',
            email: 'test@example.com',
            role: 'admin',
        };
        const context = createMockContext(user);
        const factory = getParamDecoratorFactory(CurrentUser);

        const result = factory(undefined, context);

        expect(result).toEqual(user);
    });

    it('should return specific property when specified', () => {
        const user = {
            userId: 'user-1',
            tenantId: 'tenant-1',
            email: 'test@example.com',
            role: 'admin',
        };
        const context = createMockContext(user);
        const factory = getParamDecoratorFactory(CurrentUser);

        const result = factory('tenantId', context);

        expect(result).toBe('tenant-1');
    });

    it('should return undefined for missing property', () => {
        const user = { userId: 'user-1' };
        const context = createMockContext(user);
        const factory = getParamDecoratorFactory(CurrentUser);

        const result = factory('email', context);

        expect(result).toBeUndefined();
    });

    it('should handle undefined user', () => {
        const context = createMockContext(undefined);
        const factory = getParamDecoratorFactory(CurrentUser);

        const result = factory(undefined, context);

        expect(result).toBeUndefined();
    });
});
