import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                { emit: 'stdout', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'warn' },
            ],
        });
    }

    async onModuleInit(): Promise<void> {
        this.logger.log('Connecting to database...');
        await this.$connect();
        this.logger.log('Database connected successfully');
    }

    async onModuleDestroy(): Promise<void> {
        this.logger.log('Disconnecting from database...');
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }

    async executeWithTenant<T>(
        tenantId: string,
        operation: (tx: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> {
        return this.$transaction(async (tx: Prisma.TransactionClient) => {
            const tenant = await tx.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true },
            });

            if (!tenant) {
                throw new Error(`Tenant not found: ${tenantId}`);
            }

            return operation(tx);
        });
    }
}
