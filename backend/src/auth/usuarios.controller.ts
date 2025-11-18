import { Controller, Get, Delete, Patch, Body, Param, Put, Req } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import * as jwt from 'jsonwebtoken';

@Controller("usuarios")
export class UsuariosController {
    constructor(private readonly firebaseService: FirebaseService) { }

    // Obtener lista de usuarios (excepto el logueado)
    @Get()
    async obtenerUsuarios(@Req() req) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith("Bearer "))
                return { status: "error", message: "Token no proporcionado" };

            const token = authHeader.split(" ")[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            const uidLogueado = decoded.uid;

            const snapshot = await this.firebaseService.getFirestore().collection("usuarios").get();

            const usuarios = snapshot.docs
                .filter(doc => doc.id !== uidLogueado)
                .map(doc => ({ id: doc.id, ...doc.data() }));

            return { status: "success", usuarios };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }

    // Actualizar usuario
    @Patch(":id")
    async actualizarUsuario(@Param("id") id: string, @Body() body: any) {
        try {
            const { nombre, apellidoPaterno, apellidoMaterno, telefono, rol } = body;

            if (!nombre && !apellidoPaterno && !apellidoMaterno && !telefono && !rol)
                return { status: "error", message: "No se enviaron datos para actualizar" };

            const ref = this.firebaseService.getFirestore().collection("usuarios").doc(id);
            const snap = await ref.get();

            if (!snap.exists) return { status: "error", message: "Usuario no encontrado" };

            await ref.update({
                ...(nombre && { nombre }),
                ...(apellidoPaterno && { apellidoPaterno }),
                ...(apellidoMaterno && { apellidoMaterno }),
                ...(telefono && { telefono }),
                ...(rol && { rol }),
                actualizadoEn: new Date(),
            });

            return { status: "success", message: "Usuario actualizado correctamente" };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }

    // Eliminar usuario
    @Delete(":id")
    async eliminarUsuario(@Param("id") id: string) {
        try {
            const ref = this.firebaseService.getFirestore().collection("usuarios").doc(id);
            const snap = await ref.get();
            if (!snap.exists) return { status: "error", message: "Usuario no encontrado" };

            await ref.delete();
            return { status: "success", message: "Usuario eliminado correctamente" };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }
}
