import { IsString, IsOptional, IsInt, Min, Max, Matches } from 'class-validator';

export class CreateTenantDto {
    @IsString()
    name!: string;

    @IsString()
    @Matches(/^[a-z0-9-]+$/, {
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
    slug!: string;

    @IsOptional()
    @IsInt()
    @Min(10)
    @Max(10000)
    quotaBurst?: number;

    @IsOptional()
    @IsInt()
    @Min(100)
    @Max(100000)
    quotaSustained?: number;
}

export class UpdateTenantDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsInt()
    @Min(10)
    @Max(10000)
    quotaBurst?: number;

    @IsOptional()
    @IsInt()
    @Min(100)
    @Max(100000)
    quotaSustained?: number;
}

export class TenantResponseDto {
    id!: string;
    name!: string;
    slug!: string;
    quotaBurst!: number;
    quotaSustained!: number;
    createdAt!: Date;
    updatedAt!: Date;
}
