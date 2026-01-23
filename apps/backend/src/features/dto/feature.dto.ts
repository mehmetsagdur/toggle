import {
    IsString,
    IsOptional,
    IsBoolean,
    IsEnum,
    IsInt,
    Min,
    Max,
    IsArray,
    ValidateNested,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Environment, StrategyType, Prisma } from '@prisma/client';

export class CreateFeatureDto {
    @IsString()
    @Matches(/^[a-z][a-z0-9_]*$/, {
        message: 'Key must start with lowercase letter and contain only lowercase letters, numbers, and underscores',
    })
    key!: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateFeatureDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class FeatureResponseDto {
    id!: string;
    tenantId!: string;
    key!: string;
    name!: string;
    description!: string | null;
    createdAt!: Date;
    updatedAt!: Date;
}

export class PercentageStrategyConfigDto {
    @IsInt()
    @Min(0)
    @Max(100)
    percentage!: number;

    // Index signature for Prisma compatibility
    [key: string]: unknown;
}

export class UserTargetingRuleDto {
    @IsString()
    attribute!: string;

    @IsString()
    operator!: string;

    @IsArray()
    @IsString({ each: true })
    values!: string[];

    [key: string]: unknown;
}

export class UserTargetingStrategyConfigDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UserTargetingRuleDto)
    rules!: UserTargetingRuleDto[];

    @IsBoolean()
    defaultValue!: boolean;

    [key: string]: unknown;
}

export class CreateFeatureFlagDto {
    @IsEnum(Environment)
    env!: Environment;

    @IsBoolean()
    enabled!: boolean;

    @IsEnum(StrategyType)
    strategyType!: StrategyType;

    @IsOptional()
    strategyConfig?: PercentageStrategyConfigDto | UserTargetingStrategyConfigDto;
}

export class UpdateFeatureFlagDto {
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @IsOptional()
    @IsEnum(StrategyType)
    strategyType?: StrategyType;

    @IsOptional()
    strategyConfig?: PercentageStrategyConfigDto | UserTargetingStrategyConfigDto;
}

export class FeatureFlagResponseDto {
    id!: string;
    tenantId!: string;
    featureId!: string;
    env!: Environment;
    enabled!: boolean;
    strategyType!: StrategyType;
    strategyConfig!: Prisma.JsonValue;
    version!: number;
    createdAt!: Date;
    updatedAt!: Date;
}

export class EvaluateFeatureDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    context?: Record<string, unknown>; // Custom attributes for user targeting
}

export class EvaluationResultDto {
    featureKey!: string;
    enabled!: boolean;
    reason!: 'flag_disabled' | 'boolean' | 'percentage_match' | 'percentage_miss' | 'targeting_match' | 'targeting_default';
}

export class ListFeaturesQueryDto {
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
    @IsString()
    search?: string;
}
