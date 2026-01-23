import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService, type AuthenticatedUser } from './auth.service';
import { TenantsService } from '../tenants/tenants.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class GenerateDemoTokenDto {
    @IsString()
    @IsNotEmpty()
    tenantSlug!: string;
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly tenantsService: TenantsService,
    ) { }

    @Public()
    @Post('demo-token')
    async generateDemoToken(@Body() dto: GenerateDemoTokenDto): Promise<{ token: string; tenantId: string }> {
        const tenant = await this.tenantsService.findBySlug(dto.tenantSlug);

        const token = this.authService.generateDemoToken(tenant.id);
        return { token, tenantId: tenant.id };
    }

    @Get('me')
    getProfile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
        return user;
    }

    @Public()
    @Get('verify')
    verifyToken(@Query('token') token: string): { valid: boolean; payload?: object } {
        const payload = this.authService.verifyToken(token);
        return payload ? { valid: true, payload } : { valid: false };
    }
}
