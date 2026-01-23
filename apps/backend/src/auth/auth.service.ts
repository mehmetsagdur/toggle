import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
    sub: string;      // User ID
    tenantId: string; // Tenant ID
    email: string;
    role: 'admin' | 'user';
}

export interface AuthenticatedUser {
    userId: string;
    tenantId: string;
    email: string;
    role: 'admin' | 'user';
}

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 12;

    constructor(private readonly jwtService: JwtService) { }

    generateToken(user: AuthenticatedUser): string {
        const payload: JwtPayload = {
            sub: user.userId,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }
    verifyToken(token: string): JwtPayload | null {
        try {
            return this.jwtService.verify<JwtPayload>(token);
        } catch {
            return null;
        }
    }
    // if have password use this for crypto password
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    generateDemoToken(tenantId: string): string {
        return this.generateToken({
            userId: 'demo-user',
            tenantId,
            email: 'demo@example.com',
            role: 'admin',
        });
    }
}
