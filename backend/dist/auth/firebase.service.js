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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const path_1 = require("path");
const fs_1 = require("fs");
let FirebaseService = class FirebaseService {
    defaultApp;
    constructor() {
        if (!admin.apps.length) {
            const firebaseConfig = process.env.FIREBASE_CONFIG;
            if (firebaseConfig) {
                const serviceAccount = JSON.parse(firebaseConfig);
                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key
                        .replace(/\\\\n/g, '\n')
                        .replace(/\\n/g, '\n')
                        .trim();
                }
                this.defaultApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log("Firebase inicializado desde variable de entorno (clave normalizada)");
            }
            else {
                const serviceAccountPath = (0, path_1.join)(process.cwd(), 'firebase', 'ecomarket-bd425-firebase-adminsdk-fbsvc-e03bd27836.json');
                const serviceAccount = JSON.parse((0, fs_1.readFileSync)(serviceAccountPath, 'utf8'));
                this.defaultApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log("Firebase inicializado desde archivo local");
            }
        }
        else {
            this.defaultApp = admin.app();
        }
    }
    getFirestore() {
        return this.defaultApp.firestore();
    }
    getAuth() {
        return this.defaultApp.auth();
    }
    async signInWithEmailAndPassword(email, password) {
        try {
            const apiKey = process.env.FIREBASE_API_KEY;
            const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
            const res = await axios_1.default.post(url, {
                email,
                password,
                returnSecureToken: true
            });
            return {
                uid: res.data.localId,
                email: res.data.email,
                token: res.data.idToken,
            };
        }
        catch (error) {
            throw new Error("Correo o contraseña incorrectos");
        }
    }
    async sendPasswordResetEmail(email) {
        const apiKey = process.env.FIREBASE_API_KEY;
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
        try {
            const res = await axios_1.default.post(url, {
                requestType: "PASSWORD_RESET",
                email,
            });
            return {
                status: "success",
                message: `Correo de recuperación enviado a ${email}`,
                data: res.data,
            };
        }
        catch (error) {
            throw new Error(error.response?.data?.error?.message || "Error al enviar el correo de recuperación");
        }
    }
    async confirmPasswordReset(oobCode, newPassword) {
        const apiKey = process.env.FIREBASE_API_KEY;
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`;
        try {
            const res = await axios_1.default.post(url, {
                oobCode,
                newPassword,
            });
            return {
                status: "success",
                message: "Contraseña actualizada correctamente",
                data: res.data,
            };
        }
        catch (error) {
            throw new Error(error.response?.data?.error?.message || "Código de verificación inválido o expirado");
        }
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map