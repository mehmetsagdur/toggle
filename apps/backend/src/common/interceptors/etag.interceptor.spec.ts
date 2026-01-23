import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { EtagInterceptor } from './etag.interceptor';

describe('EtagInterceptor', () => {
    let interceptor: EtagInterceptor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EtagInterceptor],
        }).compile();

        interceptor = module.get<EtagInterceptor>(EtagInterceptor);
    });

    const createMockContext = (method: string, ifNoneMatch?: string) => {
        const mockRequest = {
            method,
            header: jest.fn().mockImplementation((name: string) => {
                if (name === 'If-None-Match') return ifNoneMatch;
                return undefined;
            }),
        };

        const mockResponse = {
            headersSent: false,
            header: jest.fn(),
            status: jest.fn(),
        };

        return {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            }),
        } as unknown as ExecutionContext;
    };

    const createMockHandler = (data: any): CallHandler => ({
        handle: () => of(data),
    });

    describe('intercept', () => {
        it('should skip ETag for non-GET requests', (done) => {
            const context = createMockContext('POST');
            const handler = createMockHandler({ id: '1' });

            interceptor.intercept(context, handler).subscribe((result) => {
                expect(result).toEqual({ id: '1' });
                const response = context.switchToHttp().getResponse();
                expect(response.header).not.toHaveBeenCalled();
                done();
            });
        });

        it('should skip ETag for null/undefined data', (done) => {
            const context = createMockContext('GET');
            const handler = createMockHandler(null);

            interceptor.intercept(context, handler).subscribe((result) => {
                expect(result).toBeNull();
                done();
            });
        });

        it('should generate version-based ETag when version and id present', (done) => {
            const context = createMockContext('GET');
            const handler = createMockHandler({ id: 'abc', version: 5 });

            interceptor.intercept(context, handler).subscribe((result) => {
                expect(result).toEqual({ id: 'abc', version: 5 });
                const response = context.switchToHttp().getResponse();
                expect(response.header).toHaveBeenCalledWith('ETag', '"abc-v5"');
                done();
            });
        });

        it('should generate hash-based ETag when no version', (done) => {
            const context = createMockContext('GET');
            const handler = createMockHandler({ name: 'test' });

            interceptor.intercept(context, handler).subscribe((result) => {
                expect(result).toEqual({ name: 'test' });
                const response = context.switchToHttp().getResponse();
                expect(response.header).toHaveBeenCalledWith('ETag', expect.stringMatching(/^"[a-f0-9]{16}"$/));
                done();
            });
        });

        it('should return 304 when If-None-Match matches ETag', (done) => {
            const context = createMockContext('GET', '"abc-v5"');
            const handler = createMockHandler({ id: 'abc', version: 5 });

            interceptor.intercept(context, handler).subscribe((result) => {
                expect(result).toBeNull();
                const response = context.switchToHttp().getResponse();
                expect(response.status).toHaveBeenCalledWith(304);
                done();
            });
        });

        it('should skip if headers already sent', (done) => {
            const context = createMockContext('GET');
            const response = context.switchToHttp().getResponse() as any;
            response.headersSent = true;
            const handler = createMockHandler({ id: '1' });

            interceptor.intercept(context, handler).subscribe((result) => {
                expect(result).toEqual({ id: '1' });
                expect(response.header).not.toHaveBeenCalled();
                done();
            });
        });
    });
});
