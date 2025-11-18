import { Body, Controller, Get, Post, Param, Patch } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('solicitudAlimento')
export class SolicitudAlimentoController {
    constructor(private readonly firebaseService: FirebaseService) { }

    // Registrar nueva solicitud
    @Post()
    async registrarSolicitud(@Body() solicitud: any) {
        const db = this.firebaseService.getFirestore();

        if (typeof solicitud.tipoAlimentos === 'string') {
            solicitud.tipoAlimentos = JSON.parse(solicitud.tipoAlimentos);
        }

        const docRef = await db.collection('solicitudAlimentos').add({
            ...solicitud,
            fechaRegistro: new Date().toISOString(),
            estatusSolicitud: 'pendiente', 
        });

        return {
            status: 'success',
            message: 'Solicitud registrada correctamente',
            id: docRef.id,
        };
    }

    // Obtener todas las solicitudes del usuario
    @Get('usuario/:uid')
    async obtenerSolicitudesPorUsuario(@Param('uid') uid: string) {
        const db = this.firebaseService.getFirestore();
        const snapshot = await db
            .collection('solicitudAlimentos')
            .where('uid', '==', uid)
            .get();

        const solicitudes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { status: 'success', data: solicitudes };
    }

    // Obtener usuario (opcional)
    @Get(':uid')
    async obtenerUsuario(@Param('uid') uid: string) {
        const ref = this.firebaseService.getFirestore().collection('usuarios').doc(uid);
        const snap = await ref.get();

        if (!snap.exists) {
            return { status: 'error', message: 'Usuario no encontrado', uid };
        }

        return {
            status: 'success',
            data: snap.data(),
        };
    }

    @Patch(':id')
    async actualizarSolicitud(@Param('id') id: string, @Body() body: any) {
        const db = this.firebaseService.getFirestore();
        const ref = db.collection('solicitudAlimentos').doc(id);

        await ref.update({
            estatusSolicitud: body.estatusSolicitud,
            observacion: body.observacion || '',
            fechaRevision: body.fechaRevision || new Date().toISOString(),
        });

        return {
            status: 'success',
            message: `Solicitud ${body.estatusSolicitud} correctamente`,
        };
    }

    // Obtener donadores disponibles
    @Get('donadores/ids')
    async obtenerDonadoresConNombre() {
        const db = this.firebaseService.getFirestore();

        // Buscar usuarios con rol "donador"
        const snapshot = await db
            .collection('usuarios')
            .where('rol', '==', 'donador')
            .get();

        if (snapshot.empty) {
            return { status: 'success', data: [] };
        }

        // Devolver id y nombre completo
        const donadores = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                nombre: `${data.nombre || ''} ${data.apellidoPaterno || ''}`.trim(),
            };
        });

        return { status: 'success', data: donadores };
    }


}
