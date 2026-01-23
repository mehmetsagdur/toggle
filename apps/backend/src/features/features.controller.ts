import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Headers,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import {
    CreateFeatureDto,
    UpdateFeatureDto,
    FeatureResponseDto,
    CreateFeatureFlagDto,
    UpdateFeatureFlagDto,
    FeatureFlagResponseDto,
    EvaluateFeatureDto,
    EvaluationResultDto,
    ListFeaturesQueryDto,
    PromoteFeaturesDto,
    PromotionResultDto,
} from './dto';
import { Environment } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';

@Controller('features')
export class FeaturesController {
    constructor(private readonly featuresService: FeaturesService) { }

    @Post('promote')
    async promoteFeatures(
        @Headers('x-tenant-id') tenantId: string,
        @Body() dto: PromoteFeaturesDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<PromotionResultDto> {
        return this.featuresService.promoteFeatures(tenantId, dto, user.userId);
    }

    @Post()
    async createFeature(
        @Headers('x-tenant-id') tenantId: string,
        @Body() dto: CreateFeatureDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<FeatureResponseDto> {
        return this.featuresService.createFeature(tenantId, dto, user.userId);
    }

    @Get()
    async listFeatures(
        @Headers('x-tenant-id') tenantId: string,
        @Query() query: ListFeaturesQueryDto,
    ): Promise<{ data: FeatureResponseDto[]; total: number; page: number; limit: number }> {
        return this.featuresService.findAllFeatures(tenantId, query);
    }

    @Get(':id')
    async getFeature(
        @Headers('x-tenant-id') tenantId: string,
        @Param('id') id: string,
    ): Promise<FeatureResponseDto> {
        return this.featuresService.findOneFeature(tenantId, id);
    }

    @Patch(':id')
    async updateFeature(
        @Headers('x-tenant-id') tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateFeatureDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<FeatureResponseDto> {
        return this.featuresService.updateFeature(tenantId, id, dto, user.userId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteFeature(
        @Headers('x-tenant-id') tenantId: string,
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<void> {
        return this.featuresService.removeFeature(tenantId, id, user.userId);
    }

    @Post(':featureId/flags')
    async createFlag(
        @Headers('x-tenant-id') tenantId: string,
        @Param('featureId') featureId: string,
        @Body() dto: CreateFeatureFlagDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<FeatureFlagResponseDto> {
        return this.featuresService.createFlag(tenantId, featureId, dto, user.userId);
    }

    @Get(':featureId/flags')
    async listFlags(
        @Headers('x-tenant-id') tenantId: string,
        @Param('featureId') featureId: string,
    ): Promise<FeatureFlagResponseDto[]> {
        return this.featuresService.findAllFlags(tenantId, featureId);
    }

    @Get(':featureId/flags/:env')
    async getFlag(
        @Headers('x-tenant-id') tenantId: string,
        @Param('featureId') featureId: string,
        @Param('env') env: Environment,
    ): Promise<FeatureFlagResponseDto> {
        return this.featuresService.findFlag(tenantId, featureId, env);
    }

    @Patch(':featureId/flags/:env')
    async updateFlag(
        @Headers('x-tenant-id') tenantId: string,
        @Param('featureId') featureId: string,
        @Param('env') env: Environment,
        @Body() dto: UpdateFeatureFlagDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<FeatureFlagResponseDto> {
        return this.featuresService.updateFlag(tenantId, featureId, env, dto, user.userId);
    }

    @Delete(':featureId/flags/:env')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteFlag(
        @Headers('x-tenant-id') tenantId: string,
        @Param('featureId') featureId: string,
        @Param('env') env: Environment,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<void> {
        return this.featuresService.removeFlag(tenantId, featureId, env, user.userId);
    }

    @Post('evaluate/:featureKey')
    async evaluate(
        @Headers('x-tenant-id') tenantId: string,
        @Param('featureKey') featureKey: string,
        @Query('env') env: Environment = Environment.PROD,
        @Body() context: EvaluateFeatureDto,
    ): Promise<EvaluationResultDto> {
        return this.featuresService.evaluate(tenantId, featureKey, env, context);
    }
}
