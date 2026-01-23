import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusModule } from 'nestjs-prometheus';
import { Histogram } from 'prom-client';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

@Module({
    imports: [
        PrometheusModule.register({
            path: '/metrics',
            defaultMetrics: {
                enabled: true,
            },
        }),
    ],
    providers: [
        {
            provide: 'HTTP_DURATION_METRIC',
            useFactory: () => {
                return new Histogram({
                    name: 'http_request_duration_seconds',
                    help: 'Duration of HTTP requests in seconds',
                    labelNames: ['method', 'path', 'code'],
                    buckets: [0.1, 0.5, 1, 2, 5],
                });
            },
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: HttpMetricsInterceptor,
        },
    ],
    exports: [PrometheusModule],
})
export class ObservabilityModule { }
