import * as admin from "firebase-admin";
export declare class FirebaseService {
    private defaultApp;
    constructor();
    getFirestore(): admin.firestore.Firestore;
    getAuth(): import("firebase-admin/lib/auth/auth").Auth;
    signInWithEmailAndPassword(email: string, password: string): Promise<{
        uid: any;
        email: any;
        token: any;
    }>;
    sendPasswordResetEmail(email: string): Promise<{
        status: string;
        message: string;
        data: any;
    }>;
    confirmPasswordReset(oobCode: string, newPassword: string): Promise<{
        status: string;
        message: string;
        data: any;
    }>;
}
