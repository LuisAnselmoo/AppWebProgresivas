import { Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";
import axios from "axios";
import { join } from "path";
import { readFileSync } from "fs";

@Injectable()
export class FirebaseService {
    private defaultApp: admin.app.App;

    // constructor() {
    //     if (!admin.apps.length) {
    //         // credenciales para que el servidor pueda interactuar con Firebase Admin SDK
    //         const serviceAccountPath = join(process.cwd(), 'firebase', 'ecomarket-bd425-firebase-adminsdk-fbsvc-e03bd27836.json');
    //         // Leemos el archivo JSON con las credenciales
    //         const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    //         // Inicializamos Firebase Admin con el JSON
    //         this.defaultApp = admin.initializeApp({
    //             credential: admin.credential.cert(serviceAccount),
    //         });

    //         // console.log("Firebase inicializado correctamente:", serviceAccountPath);
    //     } else {
    //         this.defaultApp = admin.app();
    //     }
    // }
    constructor() {
        if (!admin.apps.length) {
            const firebaseConfig = process.env.FIREBASE_CONFIG;

            if (firebaseConfig) {
                // Cargar credenciales desde variable de entorno
                const serviceAccount = JSON.parse(firebaseConfig);

                // Normalizar la clave privada:
                // Si tiene doble barra, conviértela a una sola
                // Sustituye \n por saltos de línea reales
                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key
                        .replace(/\\\\n/g, '\n') // convierte \\n (doble barra) a salto real
                        .replace(/\\n/g, '\n')   // convierte \n simple a salto real
                        .trim();                 // elimina espacios extra
                }

                this.defaultApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });

                console.log("Firebase inicializado desde variable de entorno (clave normalizada)");
            } else {
                // Fallback local (solo desarrollo)
                const serviceAccountPath = join(process.cwd(), 'firebase', 'ecomarket-bd425-firebase-adminsdk-fbsvc-e03bd27836.json');
                const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

                this.defaultApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });

                console.log("Firebase inicializado desde archivo local");
            }
        } else {
            this.defaultApp = admin.app();
        }
    }


    // Acceso a Firestore para operaciones de base de datos
    getFirestore() {
        return this.defaultApp.firestore();
    }

    // Acceso a Firebase Auth para operaciones de autenticación
    getAuth() {
        return this.defaultApp.auth();
    }

    // Login con correo y contraseña usando REST API de Firebase
    async signInWithEmailAndPassword(email: string, password: string) {
        try {
            // llave de la API de Firebase, para que me permita comunicarme con los servicios de Firebase Auth
            const apiKey = process.env.FIREBASE_API_KEY;
            const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

            // Hacemos petición POST a la API de Firebase Auth
            const res = await axios.post(url, {
                email,
                password,
                returnSecureToken: true // para que nos retorne el token JWT si el login es exitoso
            });

            // Retornamos solo lo que nos interesa del response
            return {
                uid: res.data.localId,   // ID único del usuario
                email: res.data.email,   // correo del usuario
                token: res.data.idToken, // JWT emitido por Firebase
            };
        } catch (error: any) {
            throw new Error("Correo o contraseña incorrectos");
        }
    }

    // Enviar correo de recuperación de contraseña usando REST API de Firebase
    async sendPasswordResetEmail(email: string) {
        const apiKey = process.env.FIREBASE_API_KEY;
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;

        try {
            const res = await axios.post(url, {
                requestType: "PASSWORD_RESET",
                email,
            });

            return {
                status: "success",
                message: `Correo de recuperación enviado a ${email}`,
                data: res.data,
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.error?.message || "Error al enviar el correo de recuperación");
        }
    }

    // Confirmar cambio de contraseña usando REST API de Firebase
    async confirmPasswordReset(oobCode: string, newPassword: string) {
        const apiKey = process.env.FIREBASE_API_KEY;
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`;

        try {
            const res = await axios.post(url, {
                oobCode,
                newPassword,
            });

            return {
                status: "success",
                message: "Contraseña actualizada correctamente",
                data: res.data,
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.error?.message || "Código de verificación inválido o expirado");
        }
    }
}