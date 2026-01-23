import { IS_PUBLIC_KEY, Public } from './public.decorator';
import { Reflector } from '@nestjs/core';

describe('Public Decorator', () => {
    it('should set isPublic metadata to true', () => {
        @Public()
        class TestController {
            testMethod() {
                return 'test';
            }
        }

        const reflector = new Reflector();
        const isPublic = reflector.get(IS_PUBLIC_KEY, TestController);

        expect(isPublic).toBe(true);
    });

    it('should export IS_PUBLIC_KEY constant', () => {
        expect(IS_PUBLIC_KEY).toBe('isPublic');
    });
});
