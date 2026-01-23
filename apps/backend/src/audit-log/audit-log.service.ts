import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    ListAuditLogsQueryDto,
    AuditLogResponseDto,
    CreateAuditLogParams,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create an audit log entry.
     * Call this whenever a feature, flag, or tenant is created/updated/deleted.
     */
    async create(params: CreateAuditLogParams): Promise<AuditLogResponseDto> {
        return this.prisma.auditLog.create({
            data: {
                tenantId: params.tenantId,
                actorId: params.actorId,
                actorType: params.actorType,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                beforeState: params.beforeState as Prisma.InputJsonValue,
                afterState: params.afterState as Prisma.InputJsonValue,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    }

    /**
     * Find all audit logs for a tenant with pagination and filtering.
     */
    async findAll(
        tenantId: string,
        query: ListAuditLogsQueryDto,
    ): Promise<{ data: AuditLogResponseDto[]; total: number; page: number; limit: number }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.AuditLogWhereInput = {
            tenantId,
            ...(query.action && { action: query.action }),
            ...(query.entityType && { entityType: query.entityType }),
            ...(query.entityId && { entityId: query.entityId }),
            ...(query.actorId && { actorId: query.actorId }),
        };

        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    /**
     * Get audit logs for a specific entity (feature or flag).
     */
    async findByEntity(
        tenantId: string,
        entityType: string,
        entityId: string,
    ): Promise<AuditLogResponseDto[]> {
        return this.prisma.auditLog.findMany({
            where: {
                tenantId,
                entityType,
                entityId,
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50 changes
        });
    }
}
