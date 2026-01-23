import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, ActorType, Prisma } from '@prisma/client';

export class ListAuditLogsQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @IsOptional()
    @IsEnum(AuditAction)
    action?: AuditAction;

    @IsOptional()
    @IsString()
    entityType?: string;

    @IsOptional()
    @IsString()
    entityId?: string;

    @IsOptional()
    @IsString()
    actorId?: string;
}

export class AuditLogResponseDto {
    id!: string;
    tenantId!: string;
    actorId!: string;
    actorType!: ActorType;
    action!: AuditAction;
    entityType!: string;
    entityId!: string;
    beforeState!: Prisma.JsonValue;
    afterState!: Prisma.JsonValue;
    ipAddress!: string | null;
    userAgent!: string | null;
    createdAt!: Date;
}

export interface CreateAuditLogParams {
    tenantId: string;
    actorId: string;
    actorType: ActorType;
    action: AuditAction;
    entityType: string;
    entityId: string;
    beforeState?: Prisma.JsonValue;
    afterState?: Prisma.JsonValue;
    ipAddress?: string;
    userAgent?: string;
}

