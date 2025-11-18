import { Controller, Get, Patch, Delete, Req, Body, UseGuards } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import * as jwt from 'jsonwebtoken';

@Controller('miCuenta')
export class MiCuentaController {
    constructor(private readonly firebaseService: FirebaseService) { }

    // Obtener perfil del usuario autenticado
    @Get()
    async obtenerMiCuenta(@Req() req) {
        try {
            const token = this.extraerToken(req);
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            const uid = decoded.uid;

            const ref = this.firebaseService.getFirestore().collection('usuarios').doc(uid);
            const snap = await ref.get();

            if (!snap.exists) {
                return { status: 'error', message: 'Usuario no encontrado' };
            }

            return { status: 'success', usuario: { id: uid, ...snap.data() } };
        } catch (error: any) {
            return { status: 'error', message: error.message };
        }
    }

    // Actualizar perfil
    @Patch()
    async actualizarMiCuenta(@Req() req, @Body() body: any) {
        try {
            const token = this.extraerToken(req);
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            const uid = decoded.uid;

            const camposActualizables = [
                'nombre',
                'apellidoPaterno',
                'apellidoMaterno',
                'telefono',
                'calle',
                'numExterior',
                'numInterior',
                'colonia',
                'codigoPostal',
                'municipio',
                'estado',
                'referencias',
            ];

            const datosActualizar: any = {};
            camposActualizables.forEach((campo) => {
                if (body[campo] !== undefined) datosActualizar[campo] = body[campo];
            });

            if (Object.keys(datosActualizar).length === 0) {
                return { status: 'error', message: 'No se enviaron datos para actualizar' };
            }

            datosActualizar.actualizadoEn = new Date();

            const ref = this.firebaseService.getFirestore().collection('usuarios').doc(uid);
            await ref.update(datosActualizar);

            return { status: 'success', message: 'Perfil actualizado correctamente' };
        } catch (error: any) {
            return { status: 'error', message: error.message };
        }
    }

    //   Sincronizar número de teléfono con Auth
    @Patch('sync')
    async sincronizarTelefono(@Req() req, @Body() body: any) {
        try {
            const token = this.extraerToken(req);
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            const uid = decoded.uid;

            if (!body.telefono) {
                return { status: 'error', message: 'No se proporcionó el número de teléfono' };
            }

            // Actualizar en Auth
            await this.firebaseService.getAuth().updateUser(uid, {
                phoneNumber: body.telefono,
            });

            // También guardar en Firestore
            const ref = this.firebaseService.getFirestore().collection('usuarios').doc(uid);
            await ref.update({ telefono: body.telefono, sincronizadoEn: new Date() });

            return { status: 'success', message: 'Número sincronizado correctamente' };
        } catch (error: any) {
            return { status: 'error', message: error.message };
        }
    }

    //   Eliminar cuenta (requiere credenciales)
    @Delete()
    async eliminarMiCuenta(@Req() req, @Body() body: any) {
        try {
            const token = this.extraerToken(req);
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            const uid = decoded.uid;

            const { correo, password } = body;
            if (!correo || !password) {
                return { status: 'error', message: 'Credenciales requeridas para eliminar la cuenta' };
            }

            // Validar credenciales antes de eliminar
            await this.firebaseService.signInWithEmailAndPassword(correo, password);

            // Borrar datos de Firestore y Auth
            const ref = this.firebaseService.getFirestore().collection('usuarios').doc(uid);
            await ref.delete();
            await this.firebaseService.getAuth().deleteUser(uid);

            return { status: 'success', message: 'Cuenta eliminada correctamente' };
        } catch (error: any) {
            return { status: 'error', message: error.message };
        }
    }

    private extraerToken(req: any): string {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Token no proporcionado o inválido');
        return authHeader.split(' ')[1];
    }
}
