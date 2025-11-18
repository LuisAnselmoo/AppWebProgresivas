import { FirebaseService } from "./firebase.service";
import { LoginDto, RegisterDto } from "./dto/validacionDto";
export declare class AuthController {
    private readonly firebaseService;
    constructor(firebaseService: FirebaseService);
    login(body: LoginDto): Promise<{
        status: string;
        message: string;
        token: string;
        uid: any;
        rol: any;
    } | {
        status: string;
        message: any;
        token?: undefined;
        uid?: undefined;
        rol?: undefined;
    }>;
    register(body: RegisterDto): Promise<{
        status: string;
        message: string;
        uid?: undefined;
    } | {
        status: string;
        message: string;
        uid: string;
    }>;
    recoverPassword(body: {
        correo: string;
    }): Promise<{
        status: string;
        message: string;
        data: any;
    } | {
        status: string;
        message: any;
    }>;
    recoverPasswordSMS(body: {
        correo: string;
    }): Promise<{
        status: string;
        message: any;
    }>;
    resetPassword(body: {
        code: string;
        newPassword: string;
    }): Promise<{
        status: string;
        message: string;
        data: any;
    } | {
        status: string;
        message: any;
    }>;
}
