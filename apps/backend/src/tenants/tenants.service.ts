import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, TenantResponseDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
        try {
            return await this.prisma.tenant.create({
                data: {
                    name: dto.name,
                    slug: dto.slug,
                    quotaBurst: dto.quotaBurst ?? 100,
                    quotaSustained: dto.quotaSustained ?? 1000,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(`Tenant with slug "${dto.slug}" already exists`);
            }
            throw error;
        }
    }

    async findAll(): Promise<TenantResponseDto[]> {
        return this.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string): Promise<TenantResponseDto> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant with ID "${id}" not found`);
        }

        return tenant;
    }

    async findBySlug(slug: string): Promise<TenantResponseDto> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant with slug "${slug}" not found`);
        }

        return tenant;
    }

    async update(id: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
        await this.findOne(id);

        return this.prisma.tenant.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);

        await this.prisma.tenant.delete({
            where: { id },
        });
    }
}
