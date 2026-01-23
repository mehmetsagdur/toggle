import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantResponseDto } from './dto';

@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Post()
    async create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
        return this.tenantsService.create(dto);
    }

    @Get()
    async findAll(): Promise<TenantResponseDto[]> {
        return this.tenantsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<TenantResponseDto> {
        return this.tenantsService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateTenantDto,
    ): Promise<TenantResponseDto> {
        return this.tenantsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        return this.tenantsService.remove(id);
    }
}
