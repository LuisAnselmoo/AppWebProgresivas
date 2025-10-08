import { Controller, Post, Body } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { LoginDto, RegisterDto } from "./dto/validacionDto";
import * as jwt from "jsonwebtoken";

@Controller("/auth")
export class AuthController {
  constructor(private readonly firebaseService: FirebaseService) { }

  // Endpoint POST /auth/login
  @Post("login")
  async login(@Body() body: LoginDto) {
    const { correo, password, rolSeleccionado } = body;

    try {
      // Autenticación con Firebase REST API
      const authData = await this.firebaseService.signInWithEmailAndPassword(correo, password);

      // Obtener datos del usuario en Firestore
      const userDoc = await this.firebaseService
        .getFirestore()
        .collection("usuarios")
        .doc(authData.uid)
        .get();

      // Si no existe el documento, retornar error
      if (!userDoc.exists)
        return { status: "error", message: "Usuario no encontrado en la base de datos" };

      // Verificar rol
      const userData = userDoc.data();
      // Si no tiene rol, asignar "beneficiario" por defecto
      const userRole = userData?.rol || "beneficiario"; 

       // Validar que el rol seleccionado coincida
      if (rolSeleccionado && rolSeleccionado !== userRole)
        return { status: "error", message: `No tienes permisos como ${rolSeleccionado}` };

      // Generar JWT
      const jwtToken = jwt.sign(
        // Payload con uid, correo y rol
        { uid: authData.uid, correo: authData.email, rol: userRole },
        // Clave secreta y tiempo de expiración
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      );

      // Retornar datos de autenticación y rol al frontend
      return {
        status: "success",
        message: "Login exitoso",
        token: jwtToken,
        uid: authData.uid,
        rol: userRole,
      };
    } catch (error: any) {
      return { status: "error", message: error.message || "Credenciales inválidas" };
    }
  }

  // Endpoint POST /auth/register
  @Post("register")
  async register(@Body() body: RegisterDto) {
    const { nombre, apellidoPaterno, apellidoMaterno, correo, telefono, pass1, tipoUsuario } = body;

    try {
      // Crear usuario en Firebase Auth
      const user = await this.firebaseService.getAuth().createUser({
        email: correo,
        password: pass1,
        displayName: nombre,
      });

      // Guardar datos adicionales en Firestore
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
    } catch (error: any) {
      if (error.code === "auth/email-already-exists")
        return { status: "error", message: "El correo ya está registrado" };
      return { status: "error", message: "Error en el servidor: " + error.message };
    }
  }
}