import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { Request, Response } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
// Importamos ValidationPipe para validaciones automáticas de DTOs
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Creamos la aplicación NestJS con el módulo principal
  // const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configuración de CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: ['http://localhost:3000'], // orígenes permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // métodos HTTP permitidos
    credentials: true // permite enviar cookies o headers de autenticación
  });

  // Evitar cachear las rutas de la API
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    next();
  });

  app.setGlobalPrefix('api'); // prefijo global para todas las rutas de la API

  // Configuración global de validaciones usando DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // elimina automáticamente campos que no estén en el DTO
    forbidNonWhitelisted: true, // lanza error si llegan campos extra
    transform: true, // transforma automáticamente tipos
  }));

  // Obtenemos la instancia real de Express
  // Captura solo rutas sin extensión (para SPA)
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.get(/^\/(?!api|.*\..*$).*/, (req: Request, res: Response) => {
    res.sendFile(join(__dirname, '..', 'frontend', 'index.html'));
  });

  // Arrancamos el servidor en el puerto definido en variable de entorno o 3000
  // await app.listen(process.env.PORT ?? 3000);

  // Arrancamos el servidor en el puerto definido por Cloud Run o 8080
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0'); // importante usar 0.0.0.0

  console.log(`
🚀 Servidor corriendo en puerto ${port}
✅ Conexión establecida con éxito
`);

  // console.log(`
  // Servidor corriendo en: http://localhost:3000
  // Conexión establecida con éxito
  // `);
}

bootstrap();