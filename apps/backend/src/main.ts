import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('etag', false);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('BACKEND_PORT', 3001);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: false,
            },
        }),
    );

    const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000');
    const originList = allowedOrigins.split(',').map((o) => o.trim());
    app.enableCors({
        origin: originList.length === 1 ? originList[0] : originList,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    });

    app.enableShutdownHooks();

    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
        .setTitle('Feature Flag Management API')
        .setDescription('API documentation for the multi-tenant feature flag system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(port);
    logger.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap().catch((error: Error) => {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to start application', error.stack);
    process.exit(1);
});
