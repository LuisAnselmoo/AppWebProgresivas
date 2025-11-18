"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const preguntas_juego_controller_1 = require("./auth/preguntas-juego.controller");
const estadisticas_controller_1 = require("./auth/estadisticas.controller");
const adminasignaciones_controller_1 = require("./auth/adminasignaciones.controller");
const donador_controller_1 = require("./auth/donador.controller");
const beneficiario_controller_1 = require("./auth/beneficiario.controller");
const notificaciones_controller_1 = require("./auth/notificaciones.controller");
const homeadmin_controller_1 = require("./auth/homeadmin.controller");
const micuenta_controller_1 = require("./auth/micuenta.controller");
const verbeneficiarios_controller_1 = require("./auth/verbeneficiarios.controller");
const chat_gateway_1 = require("./auth/chat.gateway");
const solicitudalimento_controller_1 = require("./auth/solicitudalimento.controller");
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("./auth/firebase.service");
const auth_controller_1 = require("./auth/auth.controller");
const config_1 = require("@nestjs/config");
const usuarios_controller_1 = require("./auth/usuarios.controller");
const solicituddonacion_controller_1 = require("./auth/solicituddonacion.controller");
const path_1 = require("path");
const serve_static_1 = require("@nestjs/serve-static");
const verDonadores_controller_1 = require("./auth/verDonadores.controller");
const notificaciones_gateway_1 = require("./auth/notificaciones.gateway");
const admin_gateway_1 = require("./auth/admin.gateway");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'frontend'),
                exclude: ['/api'],
            }),
        ],
        controllers: [
            preguntas_juego_controller_1.PreguntasJuegoController,
            estadisticas_controller_1.EstadisticasController,
            adminasignaciones_controller_1.AdminAsignacionesController,
            donador_controller_1.DonadorController,
            beneficiario_controller_1.BeneficiarioController,
            notificaciones_controller_1.NotificacionesController,
            homeadmin_controller_1.HomeAdminController,
            micuenta_controller_1.MiCuentaController,
            verDonadores_controller_1.verDonadoresController,
            verbeneficiarios_controller_1.VerBeneficiariosController,
            solicitudalimento_controller_1.SolicitudAlimentoController,
            solicituddonacion_controller_1.SolicitudDonacionController,
            verDonadores_controller_1.verDonadoresController,
            auth_controller_1.AuthController,
            usuarios_controller_1.UsuariosController
        ],
        providers: [
            chat_gateway_1.ChatGateway,
            notificaciones_gateway_1.NotificacionesGateway,
            admin_gateway_1.AdminGateway,
            firebase_service_1.FirebaseService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map