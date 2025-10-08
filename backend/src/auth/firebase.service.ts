import { Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";
import axios from "axios";

@Injectable()
export class FirebaseService {
    private defaultApp: admin.app.App;

    constructor() {
        // Inicializamos Firebase Admin usando variables de entorno
        this.defaultApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
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
}