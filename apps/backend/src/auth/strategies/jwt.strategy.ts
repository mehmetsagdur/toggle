import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret-change-in-prod'),
        });
    }

    validate(payload: JwtPayload): AuthenticatedUser {
        if (!payload.sub || !payload.tenantId) {
            throw new UnauthorizedException('Invalid token payload');
        }

        return {
            userId: payload.sub,
            tenantId: payload.tenantId,
            email: payload.email,
            role: payload.role,
        };
    }
}
