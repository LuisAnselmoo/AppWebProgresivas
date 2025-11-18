import { HardwareController } from './auth/hardware.controller';
import { PreguntasJuegoController } from './auth/preguntas-juego.controller';
import { EstadisticasController } from './auth/estadisticas.controller';
import { AdminAsignacionesController } from './auth/adminasignaciones.controller';
import { DonadorController } from './auth/donador.controller';
import { BeneficiarioController } from './auth/beneficiario.controller';
import { NotificacionesController } from './auth/notificaciones.controller';
import { HomeAdminController } from './auth/homeadmin.controller';
import { MiCuentaController } from './auth/micuenta.controller';
import { VerBeneficiariosController } from './auth/verbeneficiarios.controller';
import { ChatGateway } from './auth/chat.gateway';
import { SolicitudAlimentoController } from './auth/solicitudalimento.controller';
import { Module } from '@nestjs/common';
import { FirebaseService } from './auth/firebase.service';
import { AuthController } from './auth/auth.controller';
import { ConfigModule } from '@nestjs/config';
import { UsuariosController } from './auth/usuarios.controller';
import { SolicitudDonacionController } from './auth/solicituddonacion.controller';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { verDonadoresController } from './auth/verDonadores.controller';
import { NotificacionesGateway } from './auth/notificaciones.gateway';
import { AdminGateway } from './auth/admin.gateway';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // sirve para configurar el módulo de archivos estáticos del frontend
    ServeStaticModule.forRoot({
      // Configuración para servir archivos estáticos desde el directorio 'frontend'
      rootPath: join(__dirname, '..', 'frontend'),
      // serveRoot: '/',
      exclude: ['/api'],
    }),

  ],
  controllers: [
    HardwareController,
    PreguntasJuegoController,
    EstadisticasController,
    AdminAsignacionesController,
    DonadorController,
    BeneficiarioController,
    NotificacionesController,
    HomeAdminController,
    MiCuentaController,
    verDonadoresController,
    VerBeneficiariosController,
    SolicitudAlimentoController,
    SolicitudDonacionController,
    verDonadoresController,
    AuthController,
    UsuariosController
  ],
  providers: [
    ChatGateway,
    NotificacionesGateway,
    AdminGateway,
    FirebaseService,
  ],
})
export class AppModule { }
