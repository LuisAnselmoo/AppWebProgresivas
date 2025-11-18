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
        const { correo, pass1, tipoUsuario } = body;
        try {
            try {
                const existingUser = await this.firebaseService.getAuth().getUserByEmail(correo);
                if (existingUser) {
                    return { status: "error", message: "El correo ya está registrado" };
                }
            }
            catch { }
            const user = await this.firebaseService.getAuth().createUser({
                email: correo,
                password: pass1,
                displayName: body.nombre,
            });
            const usuarioData = {
                nombre: body.nombre,
                apellidoPaterno: body.apellidoPaterno,
                apellidoMaterno: body.apellidoMaterno,
                correo: body.correo,
                telefono: body.telefono,
                tipoUsuario,
                rol: tipoUsuario,
                fechaCreacion: new Date(),
                tipoBeneficiario: body.tipoBeneficiario || null,
                nombreBeneficiario: body.nombreBeneficiario || null,
                curpRfcBeneficiario: body.curpRfcBeneficiario || null,
                tipoDonador: body.tipoDonador || null,
                nombreEmpresa: body.nombreEmpresa || null,
                rfcEmpresa: body.rfcEmpresa || null,
                nombreRepresentante: body.nombreRepresentante || null,
                cargoRepresentante: body.cargoRepresentante || null,
                contactoAlterno: body.contactoAlterno || null,
                correoAlterno: body.correoAlterno || null,
                calle: body.calle || null,
                numExterior: body.numExterior || null,
                numInterior: body.numInterior || null,
                colonia: body.colonia || null,
                codigoPostal: body.codigoPostal || null,
                municipio: body.municipio || null,
                estado: body.estado || null,
                referencias: body.referencias || null,
            };
            await this.firebaseService.getFirestore().collection("usuarios").doc(user.uid).set(usuarioData);
            return { status: "success", message: "Usuario registrado correctamente", uid: user.uid };
        }
        catch (error) {
            let message = "Error desconocido en el servidor";
            if (error.code === "auth/email-already-exists")
                message = "El correo ya está registrado";
            else if (error.code === "auth/invalid-password")
                message = "La contraseña no es válida";
            else if (error.code === "auth/invalid-email")
                message = "El correo tiene un formato inválido";
            else if (error.message?.includes("Firestore"))
                message = "Error al guardar datos en Firestore";
            return { status: "error", message };
        }
    }
    async recoverPassword(body) {
        try {
            const { correo } = body;
            if (!correo)
                return { status: "error", message: "El correo es obligatorio" };
            const result = await this.firebaseService.sendPasswordResetEmail(correo);
            return result;
        }
        catch (error) {
            return { status: "error", message: error.message };
        }
    }
    async recoverPasswordSMS(body) {
        try {
            const { correo } = body;
            if (!correo)
                return { status: "error", message: "El correo es obligatorio" };
            const snapshot = await this.firebaseService
                .getFirestore()
                .collection("usuarios")
                .where("correo", "==", correo)
                .get();
            if (snapshot.empty)
                return { status: "error", message: "Usuario no encontrado" };
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            if (!userData.telefono)
                return { status: "error", message: "No hay teléfono registrado para este usuario" };
            const telefono = userData.telefono;
            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            await this.firebaseService.getFirestore()
                .collection("recuperaciones")
                .doc(userDoc.id)
                .set({
                codigo,
                telefono,
                creadoEn: new Date(),
                expiracion: new Date(Date.now() + 10 * 60 * 1000),
            });
            return { status: "success", message: "SMS de recuperación enviado." };
        }
        catch (error) {
            return { status: "error", message: error.message };
        }
    }
    async resetPassword(body) {
        try {
            const { code, newPassword } = body;
            if (!code || !newPassword)
                return { status: "error", message: "Código y nueva contraseña requeridos" };
            const result = await this.firebaseService.confirmPasswordReset(code, newPassword);
            return result;
        }
        catch (error) {
            return { status: "error", message: error.message };
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
__decorate([
    (0, common_1.Post)("recover"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "recoverPassword", null);
__decorate([
    (0, common_1.Post)("recover-sms"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "recoverPasswordSMS", null);
__decorate([
    (0, common_1.Post)("reset-password"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("/auth"),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map