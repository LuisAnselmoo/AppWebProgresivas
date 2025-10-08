import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Importamos ValidationPipe para validaciones automáticas de DTOs
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Creamos la aplicación NestJS con el módulo principal
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // orígenes permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // métodos HTTP permitidos
    credentials: true // permite enviar cookies o headers de autenticación
  });

  // Configuración global de validaciones usando DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // elimina automáticamente campos que no estén en el DTO
    forbidNonWhitelisted: true, // lanza error si llegan campos extra
    transform: true, // transforma automáticamente tipos
  }));

  // Arrancamos el servidor en el puerto definido en variable de entorno o 3000
  await app.listen(process.env.PORT ?? 3000);
  console.log(`
  🚀 Servidor corriendo en: http://localhost:3000
  ✅ Conexión establecida con éxito
  `);
}

bootstrap();