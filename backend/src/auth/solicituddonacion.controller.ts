import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { SolicitudDonacionDto } from './dto/solicitudDonacion.dto';
import { FirebaseService } from "./firebase.service";

@Controller('solicitudDonacion')
export class SolicitudDonacionController {
    constructor(private readonly firebaseService: FirebaseService) { }

    // Guardar una nueva solicitud en Firestore
    @Post()
    async registrarSolicitud(@Body() solicitud: any) {
        // console.log('Solicitud recibida en backend:', solicitud);

        const db = this.firebaseService.getFirestore();

        const docRef = await db.collection('solicitudDonacion').add({
            ...solicitud,
            fechaRegistro: new Date().toISOString(),
        });

        return {
            status: 'success',
            message: 'Solicitud registrada correctamente',
            id: docRef.id,
        };
    }


    @Get(':uid')
    async obtenerUsuario(@Param('uid') uid: string) {
        const ref = this.firebaseService.getFirestore().collection('usuarios').doc(uid);
        const snap = await ref.get();

        if (!snap.exists) {
            return { status: 'error', message: 'Usuario no encontrado', uid };
        }

        return {
            status: 'success',
            message: 'Usuario encontrado',
            data: snap.data(),
        };
    }

    // traer los datos
    @Get('usuario/:uid')
    async obtenerSolicitudesPorUsuario(@Param('uid') uid: string) {
        const db = this.firebaseService.getFirestore();
        const snapshot = await db
            .collection('solicitudDonacion')
            .where('uid', '==', uid)
            .get();

        if (snapshot.empty) {
            return { status: 'success', data: [] };
        }

        const solicitudes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { status: 'success', data: solicitudes };
    }

    @Get('beneficiarios/ids')
    async obtenerBeneficiariosConNombre() {
        const db = this.firebaseService.getFirestore();

        const snapshot = await db
            .collection('usuarios')
            .where('rol', '==', 'beneficiario')
            .get();

        if (snapshot.empty) {
            return { status: 'success', data: [] };
        }

        const beneficiarios = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                nombre: `${data.nombre || ''} ${data.apellidoPaterno || ''}`.trim(),
            };
        });

        return { status: 'success', data: beneficiarios };
    }

}
