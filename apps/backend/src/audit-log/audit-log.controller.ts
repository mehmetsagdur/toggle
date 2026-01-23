import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { ListAuditLogsQueryDto, type AuditLogResponseDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';

@Controller('audit-logs')
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    /**
     * Get paginated audit logs for the current tenant.
     */
    @Get()
    async findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: ListAuditLogsQueryDto,
    ): Promise<{ data: AuditLogResponseDto[]; total: number; page: number; limit: number }> {
        return this.auditLogService.findAll(user.tenantId, query);
    }

    /**
     * Get audit logs for a specific entity.
     */
    @Get('entity')
    async findByEntity(
        @CurrentUser() user: AuthenticatedUser,
        @Query('entityType') entityType: string,
        @Query('entityId') entityId: string,
    ): Promise<AuditLogResponseDto[]> {
        return this.auditLogService.findByEntity(user.tenantId, entityType, entityId);
    }
}
