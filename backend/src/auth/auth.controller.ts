import { Controller, Post, Body } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { LoginDto, RegisterDto } from "./dto/validacionDto";
import * as jwt from "jsonwebtoken";
// import { sign } from "jsonwebtoken";

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
    const { correo, pass1, tipoUsuario } = body;

    try {
      // Verificar si el correo ya existe antes de crear el usuario
      try {
        const existingUser = await this.firebaseService.getAuth().getUserByEmail(correo);
        if (existingUser) {
          return { status: "error", message: "El correo ya está registrado" };
        }
      } catch { }

      // Crear usuario en Firebase Auth
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

      // Guardar en Firestore
      await this.firebaseService.getFirestore().collection("usuarios").doc(user.uid).set(usuarioData);

      return { status: "success", message: "Usuario registrado correctamente", uid: user.uid };

    } catch (error: any) {
      // console.error("Error al registrar:", error);

      // error comunes
      let message = "Error desconocido en el servidor";
      if (error.code === "auth/email-already-exists") message = "El correo ya está registrado";
      else if (error.code === "auth/invalid-password") message = "La contraseña no es válida";
      else if (error.code === "auth/invalid-email") message = "El correo tiene un formato inválido";
      else if (error.message?.includes("Firestore")) message = "Error al guardar datos en Firestore";

      return { status: "error", message };
    }
  }

  // Endpoint para iniciar el proceso de recuperación de contraseña
  @Post("recover")
  async recoverPassword(@Body() body: { correo: string }) {
    try {
      const { correo } = body;
      if (!correo) return { status: "error", message: "El correo es obligatorio" };

      const result = await this.firebaseService.sendPasswordResetEmail(correo);
      return result;
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }

  // Endpoint para recuperación de contraseña vía SMS (si tiene teléfono)
  @Post("recover-sms")
  async recoverPasswordSMS(@Body() body: { correo: string }) {
    try {
      const { correo } = body;
      if (!correo) return { status: "error", message: "El correo es obligatorio" };

      // Buscar al usuario en Firestore
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

      // Aquí podrías usar una API de SMS (por ejemplo, Twilio, MessageBird o Firebase SMS)
      // Por simplicidad, lo simulamos:
      // console.log(`Enviando SMS de recuperación a ${telefono}`);

      // En un caso real: generar un código y guardarlo en Firestore
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      await this.firebaseService.getFirestore()
        .collection("recuperaciones")
        .doc(userDoc.id)
        .set({
          codigo,
          telefono,
          creadoEn: new Date(),
          expiracion: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        });

      // Aquí enviarías el SMS (ej. Twilio)
      // await twilio.messages.create({ to: telefono, from: process.env.TWILIO_FROM, body: `Tu código: ${codigo}` });

      return { status: "success", message: "SMS de recuperación enviado." };
    } catch (error: any) {
      // console.error("Error al enviar SMS:", error);
      return { status: "error", message: error.message };
    }
  }

  // Endpoint para confirmar el restablecimiento de contraseña
  @Post("reset-password")
  async resetPassword(@Body() body: { code: string; newPassword: string }) {
    try {
      const { code, newPassword } = body;
      if (!code || !newPassword)
        return { status: "error", message: "Código y nueva contraseña requeridos" };

      const result = await this.firebaseService.confirmPasswordReset(code, newPassword);
      return result;
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }

}