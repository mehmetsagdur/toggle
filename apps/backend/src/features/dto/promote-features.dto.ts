import { IsEnum, IsBoolean, IsOptional, IsArray, IsString } from 'class-validator';
import { Environment } from '@prisma/client';

export class PromoteFeaturesDto {
    @IsEnum(Environment)
    sourceEnv!: Environment;

    @IsEnum(Environment)
    targetEnv!: Environment;

    @IsBoolean()
    @IsOptional()
    dryRun?: boolean = false;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    featureKeys?: string[];
}

export class PromotionResultDto {
    sourceEnv!: Environment;
    targetEnv!: Environment;
    dryRun!: boolean;
    stats!: {
        featuresScanned: number;
        flagsCreated: number;
        flagsUpdated: number;
        flagsSkipped: number;
    };
    changes!: Array<{
        featureKey: string;
        action: 'CREATE' | 'UPDATE' | 'SKIP';
        diff?: {
            field: string;
            oldValue: any;
            newValue: any;
        }[];
    }>;
}
