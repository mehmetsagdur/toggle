import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    override canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const path: string = request.url;

        const publicPaths = ['/metrics', '/api/docs', '/api/docs-json'];
        if (publicPaths.some(p => path.startsWith(p))) {
            return true;
        }

        return super.canActivate(context);
    }

    override handleRequest<TUser>(
        err: Error | null,
        user: TUser | false,
        info: Error | undefined,
    ): TUser {
        if (err || !user) {
            throw err || new UnauthorizedException(info?.message || 'Unauthorized');
        }
        return user;
    }
}

