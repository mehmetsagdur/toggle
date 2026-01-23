import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as crypto from 'crypto';
import { Request, Response } from 'express';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request>();

        if (req.method !== 'GET') {
            return next.handle();
        }

        return next.handle().pipe(
            map((data) => {
                const res = context.switchToHttp().getResponse<Response>();

                // If response is already sent (e.g., from another interceptor or guard), skip
                if (res.headersSent) {
                    return data;
                }

                if (!data) {
                    return data;
                }

                let etag: string;

                if (data.version !== undefined && data.id) {
                    etag = `"${data.id}-v${data.version}"`;
                } else {
                    const hash = crypto
                        .createHash('sha1')
                        .update(JSON.stringify(data))
                        .digest('hex');
                    etag = `"${hash.substring(0, 16)}"`;
                }

                res.header('ETag', etag);

                const ifNoneMatch = req.header('If-None-Match');
                if (ifNoneMatch === etag) {
                    res.status(304);
                    // 304 responses must not have a body
                    return null;
                }

                return data;
            }),
        );
    }
}
