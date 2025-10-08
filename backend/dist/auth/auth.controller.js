"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("./firebase.service");
const validacionDto_1 = require("./dto/validacionDto");
const jwt = require("jsonwebtoken");
let AuthController = class AuthController {
    firebaseService;
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
    }
    async login(body) {
        const { correo, password, rolSeleccionado } = body;
        try {
            const authData = await this.firebaseService.signInWithEmailAndPassword(correo, password);
            const userDoc = await this.firebaseService
                .getFirestore()
                .collection("usuarios")
                .doc(authData.uid)
                .get();
            if (!userDoc.exists)
                return { status: "error", message: "Usuario no encontrado en la base de datos" };
            const userData = userDoc.data();
            const userRole = userData?.rol || "beneficiario";
            if (rolSeleccionado && rolSeleccionado !== userRole)
                return { status: "error", message: `No tienes permisos como ${rolSeleccionado}` };
            const jwtToken = jwt.sign({ uid: authData.uid, correo: authData.email, rol: userRole }, process.env.JWT_SECRET, { expiresIn: "1h" });
            return {
                status: "success",
                message: "Login exitoso",
                token: jwtToken,
                uid: authData.uid,
                rol: userRole,
            };
        }
        catch (error) {
            return { status: "error", message: error.message || "Credenciales inválidas" };
        }
    }
    async register(body) {
        const { nombre, apellidoPaterno, apellidoMaterno, correo, telefono, pass1, tipoUsuario } = body;
        try {
            const user = await this.firebaseService.getAuth().createUser({
                email: correo,
                password: pass1,
                displayName: nombre,
            });
            await this.firebaseService.getFirestore().collection("usuarios").doc(user.uid).set({
                nombre,
                apellidoPaterno,
                apellidoMaterno,
                correo,
                telefono,
                rol: tipoUsuario,
                fechaCreacion: new Date(),
            });
            return { status: "success", message: "Usuario registrado correctamente", uid: user.uid };
        }
        catch (error) {
            if (error.code === "auth/email-already-exists")
                return { status: "error", message: "El correo ya está registrado" };
            return { status: "error", message: "Error en el servidor: " + error.message };
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validacionDto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("register"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validacionDto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("/auth"),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map