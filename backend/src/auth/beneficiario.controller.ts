import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('beneficiario')
export class BeneficiarioController {
  constructor(private readonly firebaseService: FirebaseService) { }

  // Donaciones asignadas (pendientes)
  @Get('donaciones-asignadas/:uid')
  async obtenerDonacionesAsignadas(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();
    const snap = await db
      .collection('solicitudDonacion')
      .where('beneficiarioAsignado', '==', uid)
      .where('estatusDonacion', '==', 'pendiente')
      .get();

    const donaciones = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        ...data,
        tipo: 'donacion',
        productos: data.productos || [],
      };
    });

    return { status: 'success', data: donaciones };
  }

  // Solicitudes aprobadas
  @Get('solicitudes-aprobadas/:uid')
  async obtenerSolicitudesAprobadas(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();
    const snap = await db
      .collection('solicitudAlimentos')
      .where('uid', '==', uid)
      .where('estatusSolicitud', '==', 'aprobado')
      .get();

    const solicitudes = snap.docs.map((d) => {
      const data = d.data() || {};
      const alimentos =
        Array.isArray(data.tipoAlimentos) && data.tipoAlimentos.length
          ? data.tipoAlimentos.map((nombre: any) => ({
            nombre,
            categoria: 'General',
            cantidad: 1,
            unidad: '',
          }))
          : [];

      return {
        id: d.id,
        ...data,
        tipo: 'solicitud',
        productos: alimentos,
      };
    });

    return { status: 'success', data: solicitudes };
  }

  // Donaciones aprobadas
  @Get('donaciones-aprobadas/:uid')
  async obtenerDonacionesAprobadas(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();
    const snap = await db
      .collection('solicitudDonacion')
      .where('beneficiarioAsignado', '==', uid)
      .where('estatusDonacion', '==', 'aprobado')
      .get();

    const donaciones = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        ...data,
        tipo: 'donacion',
        productos: data.productos || [],
      };
    });

    return { status: 'success', data: donaciones };
  }

  // Aceptar o rechazar donación
  @Patch('aceptar-donacion/:id')
  async aceptarDonacion(
    @Param('id') id: string,
    @Body() body: { aceptar: boolean; comentarios?: string },
  ) {
    const db = this.firebaseService.getFirestore();
    const ref = db.collection('solicitudDonacion').doc(id);
    const doc = await ref.get();

    if (!doc.exists)
      return { status: 'error', message: 'Donación no encontrada' };

    if (body.aceptar) {
      await ref.update({
        estatusDonacion: 'aprobado',
        estatusEntrega: 'en curso',
        comentariosBeneficiario: body.comentarios || '',
        fechaRevision: new Date().toISOString(),
      });

      return {
        status: 'success',
        message: 'Donación aceptada, pendiente de confirmar recepción',
      };
    } else {
      await ref.update({
        estatusDonacion: 'rechazado',
        comentariosBeneficiario: body.comentarios || '',
        fechaRevision: new Date().toISOString(),
      });
      return {
        status: 'success',
        message: 'Donación rechazada',
      };
    }
  }

  // Confirmar recepción sincronizada
  @Patch('confirmar-recepcion/:id')
  async confirmarRecepcion(
    @Param('id') id: string,
    @Body() body: { recibida: boolean; comentarios?: string; tipo: string },
  ) {
    const db = this.firebaseService.getFirestore();
    const col =
      body.tipo === 'solicitud' ? 'solicitudAlimentos' : 'solicitudDonacion';
    const ref = db.collection(col).doc(id);

    const doc = await ref.get();
    if (!doc.exists)
      return { status: 'error', message: 'Documento no encontrado' };

    const data = doc.data() || {};
    const nuevoEstadoBeneficiario = body.recibida ? 'recibida' : 'no recibida';
    const comentario = body.comentarios || '';

    await ref.update({
      estatusEntregaBeneficiario: nuevoEstadoBeneficiario,
      comentariosBeneficiario: comentario,
      fechaConfirmacion: new Date().toISOString(),
    });

    const donadorEstado = (data as any).estatusEntregaDonador || 'pendiente';
    let estatusEntrega = (data as any).estatusEntrega || 'en curso';

    // Casos sincronizados
    if (donadorEstado === 'entregada' && nuevoEstadoBeneficiario === 'recibida') {
      estatusEntrega = 'finalizada';

      // Disparar alerta al Arduino
      fetch("http://IP_DEL_ARDUINO/alerta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerta: true })
      }).catch(err => console.error("Error enviando alerta al Arduino:", err));
      
    } else if (nuevoEstadoBeneficiario === 'no recibida') {
      // Si el beneficiario no recibió, el donador puede volver a marcar entrega
      await ref.update({
        estatusEntregaDonador: 'pendiente',
        estatusEntregaBeneficiario: 'pendiente', // Reiniciamos su estado
      });
      estatusEntrega = 'en curso';
    } else if (donadorEstado === 'no entregada') {
      estatusEntrega = 'cancelada';
    }

    await ref.update({ estatusEntrega });

    return {
      status: 'success',
      message: body.recibida
        ? 'Entrega marcada como recibida. ¡Gracias!'
        : 'Entrega no recibida. El donador podrá volver a intentar la entrega.',
    };
  }

}
