import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';
import Redis from 'ioredis';

describe('RedisService', () => {
    let service: RedisService;
    let mockRedis: jest.Mocked<Redis>;

    beforeEach(async () => {
        mockRedis = {
            get: jest.fn(),
            set: jest.fn(),
            setex: jest.fn(),
            del: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn(),
            ttl: jest.fn(),
            quit: jest.fn(),
            multi: jest.fn(),
            zremrangebyscore: jest.fn(),
            zadd: jest.fn(),
            zcard: jest.fn(),
        } as unknown as jest.Mocked<Redis>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RedisService,
                { provide: REDIS_CLIENT, useValue: mockRedis },
            ],
        }).compile();

        service = module.get<RedisService>(RedisService);
    });

    describe('get', () => {
        it('should return value from redis', async () => {
            mockRedis.get.mockResolvedValue('test-value');

            const result = await service.get('test-key');

            expect(result).toBe('test-value');
            expect(mockRedis.get).toHaveBeenCalledWith('test-key');
        });

        it('should return null if key not found', async () => {
            mockRedis.get.mockResolvedValue(null);

            const result = await service.get('missing-key');

            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should set value without TTL', async () => {
            await service.set('key', 'value');

            expect(mockRedis.set).toHaveBeenCalledWith('key', 'value');
        });

        it('should set value with TTL using setex', async () => {
            await service.set('key', 'value', 60);

            expect(mockRedis.setex).toHaveBeenCalledWith('key', 60, 'value');
        });
    });

    describe('del', () => {
        it('should delete key', async () => {
            await service.del('key');

            expect(mockRedis.del).toHaveBeenCalledWith('key');
        });
    });

    describe('incr', () => {
        it('should increment and return new value', async () => {
            mockRedis.incr.mockResolvedValue(5);

            const result = await service.incr('counter');

            expect(result).toBe(5);
            expect(mockRedis.incr).toHaveBeenCalledWith('counter');
        });
    });

    describe('expire', () => {
        it('should set expiry on key', async () => {
            await service.expire('key', 300);

            expect(mockRedis.expire).toHaveBeenCalledWith('key', 300);
        });
    });

    describe('ttl', () => {
        it('should return TTL of key', async () => {
            mockRedis.ttl.mockResolvedValue(120);

            const result = await service.ttl('key');

            expect(result).toBe(120);
        });
    });

    describe('checkRateLimit', () => {
        it('should allow request when under limit', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, 0],
                    [null, 1],
                    [null, 5], // count = 5
                    [null, 1],
                ]),
            };
            mockRedis.multi.mockReturnValue(mockMulti as any);

            const result = await service.checkRateLimit('key', 10, 60);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(5);
        });

        it('should deny request when over limit', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, 0],
                    [null, 1],
                    [null, 15], // count = 15, limit = 10
                    [null, 1],
                ]),
            };
            mockRedis.multi.mockReturnValue(mockMulti as any);

            const result = await service.checkRateLimit('key', 10, 60);

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should handle null results gracefully', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null),
            };
            mockRedis.multi.mockReturnValue(mockMulti as any);

            const result = await service.checkRateLimit('key', 10, 60);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(10);
        });
    });

    describe('onModuleDestroy', () => {
        it('should quit redis connection', async () => {
            await service.onModuleDestroy();

            expect(mockRedis.quit).toHaveBeenCalled();
        });
    });
});
