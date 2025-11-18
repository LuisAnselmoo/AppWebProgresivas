import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('admin/asignaciones')
export class AdminAsignacionesController {
  constructor(private readonly firebaseService: FirebaseService) {}

  // Obtener solicitudes sin asignar
  @Get('sin-asignar')
  async obtenerSinAsignar() {
    const db = this.firebaseService.getFirestore();

    const solicitudesBenSnap = await db
      .collection('solicitudAlimentos')
      .where('estatusSolicitud', '==', 'pendiente')
      .where('donadorAsignado', '==', null)
      .get();

    const solicitudesDonSnap = await db
      .collection('solicitudDonacion')
      .where('estatusDonacion', '==', 'pendiente')
      .where('beneficiarioAsignado', '==', null)
      .get();

    return {
      status: 'success',
      data: {
        beneficiarios: solicitudesBenSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        donadores: solicitudesDonSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      },
    };
  }

  // Asignar una solicitud beneficiario ↔ donador
  @Post('asignar')
  async asignarSolicitud(
    @Body()
    body: {
      tipo: 'beneficiario' | 'donador';
      solicitudId: string;
      destinoId: string;
    },
  ) {
    const db = this.firebaseService.getFirestore();
    const { tipo, solicitudId, destinoId } = body;

    if (!tipo || !solicitudId || !destinoId)
      return { status: 'error', message: 'Datos incompletos.' };

    const col = tipo === 'beneficiario' ? 'solicitudAlimentos' : 'solicitudDonacion';
    const ref = db.collection(col).doc(solicitudId);
    const doc = await ref.get();
    if (!doc.exists) return { status: 'error', message: 'Solicitud no encontrada.' };

    // Asignación cruzada
    const updateData =
      tipo === 'beneficiario'
        ? { donadorAsignado: destinoId }
        : { beneficiarioAsignado: destinoId };

    await ref.update(updateData);

    return { status: 'success', message: 'Solicitud asignada correctamente.' };
  }

  // Bodega del administrador
  @Get('bodega')
  async obtenerBodega() {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('solicitudDonacion')
      .where('estatusDonacion', '==', 'aprobado')
      .where('beneficiarioAsignado', '==', null)
      .get();

    const bodega = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        productos: data.productos || [],
      };
    });

    return { status: 'success', data: bodega };
  }
}
