
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
// import { getMetricToken } from 'nestjs-prometheus';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
    constructor(
        @Inject('HTTP_DURATION_METRIC')
        public readonly histogram: any,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const start = Date.now();
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        return next.handle().pipe(
            tap(() => {
                const duration = (Date.now() - start) / 1000;
                const { method, route } = request;
                const { statusCode } = response;

                const path = route ? route.path : request.url;

                this.histogram.labels(method, path, statusCode.toString()).observe(duration);
            }),
        );
    }
}
