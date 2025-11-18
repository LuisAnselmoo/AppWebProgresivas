"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true
    });
    app.use((req, res, next) => {
        if (req.path.startsWith('/api/')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }
        next();
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get(/^\/(?!api|.*\..*$).*/, (req, res) => {
        res.sendFile((0, path_1.join)(__dirname, '..', 'frontend', 'index.html'));
    });
    const port = process.env.PORT || 8080;
    await app.listen(port, '0.0.0.0');
    console.log(`
🚀 Servidor corriendo en puerto ${port}
✅ Conexión establecida con éxito
`);
}
bootstrap();
//# sourceMappingURL=main.js.map