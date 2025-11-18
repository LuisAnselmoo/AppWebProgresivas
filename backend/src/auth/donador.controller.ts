import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { FirebaseService } from '../auth/firebase.service';

@Controller('donador')
export class DonadorController {
  constructor(private readonly firebaseService: FirebaseService) { }

  // Donaciones creadas
  @Get('mis-donaciones/:uid')
  async obtenerMisDonaciones(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();
    const snap = await db
      .collection('solicitudDonacion')
      .where('uid', '==', uid)
      .get();

    const donaciones = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      tipo: 'donacion',
    }));

    return { status: 'success', data: donaciones };
  }

  // Donaciones pendientes
  @Get('donaciones-pendientes/:uid')
  async obtenerDonacionesPendientes(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();
    const snap = await db
      .collection('solicitudDonacion')
      .where('uid', '==', uid)
      .where('estatusDonacion', '==', 'pendiente')
      .get();

    const pendientes = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      tipo: 'donacion',
    }));

    return { status: 'success', data: pendientes };
  }

  // Donaciones aprobadas / solicitudes en curso
  @Get('donaciones-aprobadas/:uid')
  async obtenerDonacionesAprobadas(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();

    const donacionesSnap = await db
      .collection('solicitudDonacion')
      .where('uid', '==', uid)
      .where('estatusDonacion', '==', 'aprobado')
      .get();

    const solicitudesSnap = await db
      .collection('solicitudAlimentos')
      .where('donadorAsignado', '==', uid)
      .where('estatusSolicitud', '==', 'aprobado')
      .get();

    // Donaciones aprobadas
    const donaciones = await Promise.all(
      donacionesSnap.docs.map(async (d) => {
        const data = d.data() || {};
        let beneficiarioAsignadoNombre =
          data.beneficiarioAsignadoNombre ||
          data.nombreBeneficiario ||
          '';

        const beneficiarioId =
          data.beneficiarioAsignado ||
          data.beneficiarioAsignadoId ||
          data.beneficiario ||
          '';

        if (!beneficiarioAsignadoNombre && beneficiarioId) {
          try {
            const benRef = db.collection('usuarios').doc(beneficiarioId);
            const benDoc = await benRef.get();
            if (benDoc.exists) {
              const benData = benDoc.data() || {};
              const nombreCompleto = [
                benData.nombre,
                benData.apellidoPaterno,
                benData.apellidoMaterno,
              ]
                .filter(Boolean)
                .join(' ');
              beneficiarioAsignadoNombre = nombreCompleto || 'Beneficiario';
            }
          } catch {
            beneficiarioAsignadoNombre = 'Beneficiario';
          }
        }

        const productos =
          Array.isArray(data.productos) && data.productos.length > 0
            ? data.productos.map((p: any) =>
              typeof p === 'string'
                ? { nombre: p, cantidad: 1, unidad: '' }
                : {
                  nombre: p.nombre || 'Producto',
                  cantidad: p.cantidad || 1,
                  unidad: p.unidad || '',
                }
            )
            : [];

        return {
          id: d.id,
          ...data,
          beneficiarioAsignadoNombre,
          productos,
          tipo: 'donacion',
        };
      })
    );

    // Solicitudes aprobadas (asignadas al donador)
    const solicitudes = await Promise.all(
      solicitudesSnap.docs.map(async (d) => {
        const data = d.data() || {};

        let beneficiarioAsignadoNombre =
          data.nombreBeneficiario || data.beneficiarioAsignadoNombre || '';

        const beneficiarioId = data.uid || data.beneficiarioAsignado;
        if (!beneficiarioAsignadoNombre && beneficiarioId) {
          try {
            const benRef = db.collection('usuarios').doc(beneficiarioId);
            const benDoc = await benRef.get();
            if (benDoc.exists) {
              const benData = benDoc.data() || {};
              const nombreCompleto = [
                benData.nombre,
                benData.apellidoPaterno,
                benData.apellidoMaterno,
              ]
                .filter(Boolean)
                .join(' ');
              beneficiarioAsignadoNombre = nombreCompleto || 'Beneficiario';
            }
          } catch {
            beneficiarioAsignadoNombre = 'Beneficiario';
          }
        }

        const productos =
          Array.isArray(data.tipoAlimentos) && data.tipoAlimentos.length > 0
            ? data.tipoAlimentos.map((item: any) =>
              typeof item === 'string'
                ? { nombre: item, cantidad: 1, unidad: '' }
                : {
                  nombre: item.nombre || 'Producto',
                  cantidad: item.cantidad || 1,
                  unidad: item.unidad || '',
                }
            )
            : [];

        return {
          id: d.id,
          ...data,
          beneficiarioAsignadoNombre,
          productos,
          tipo: 'solicitud',
        };
      })
    );

    return { status: 'success', data: [...donaciones, ...solicitudes] };
  }

  // Solicitudes asignadas al donador
  @Get('solicitudes-asignadas/:uid')
  async obtenerSolicitudesAsignadas(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();
    const snap = await db
      .collection('solicitudAlimentos')
      .where('donadorAsignado', '==', uid)
      .where('estatusSolicitud', 'in', ['pendiente', 'en revisión'])
      .get();

    const solicitudes = snap.docs.map((d) => {
      const data = d.data() || {};
      const alimentos =
        Array.isArray(data.tipoAlimentos) && data.tipoAlimentos.length
          ? data.tipoAlimentos.map((nombre: any) =>
            typeof nombre === 'string'
              ? { nombre, categoria: 'General', cantidad: 1, unidad: '' }
              : nombre
          )
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

  // Aprobar o rechazar solicitud asignada
  @Patch('revisar-solicitud/:id')
  async revisarSolicitud(
    @Param('id') id: string,
    @Body() body: { aprobado: boolean; comentario?: string },
  ) {
    const db = this.firebaseService.getFirestore();
    const ref = db.collection('solicitudAlimentos').doc(id);

    const doc = await ref.get();
    if (!doc.exists)
      return { status: 'error', message: 'Solicitud no encontrada' };

    await ref.update({
      estatusSolicitud: body.aprobado ? 'aprobado' : 'rechazado',
      observacion: body.comentario || '',
      fechaRevision: new Date().toISOString(),
    });

    return {
      status: 'success',
      message: body.aprobado
        ? 'Solicitud aprobada correctamente'
        : 'Solicitud rechazada correctamente',
    };
  }

  // Confirmar entrega sincronizada
  @Patch('confirmar-entrega/:id')
  async confirmarEntrega(
    @Param('id') id: string,
    @Body() body: { entregada: boolean; comentarios?: string; tipo: string },
  ) {
    const db = this.firebaseService.getFirestore();
    const col =
      body.tipo === 'solicitud' ? 'solicitudAlimentos' : 'solicitudDonacion';
    const ref = db.collection(col).doc(id);

    const doc = await ref.get();
    if (!doc.exists)
      return { status: 'error', message: 'Documento no encontrado' };

    const data = doc.data() || {};
    const nuevoEstadoDonador = body.entregada ? 'entregada' : 'no entregada';
    const comentario = body.comentarios || '';

    // Actualizar estado del donador
    await ref.update({
      estatusEntregaDonador: nuevoEstadoDonador,
      comentariosDonador: comentario,
      fechaEntrega: new Date().toISOString(),
    });

    const benEstado = (data as any).estatusEntregaBeneficiario || 'pendiente';
    let estatusEntrega = (data as any).estatusEntrega || 'en curso';

    if (nuevoEstadoDonador === 'entregada' && benEstado === 'recibida') {
      estatusEntrega = 'finalizada';

      // Disparar alerta al Arduino
      fetch("http://IP_DEL_ARDUINO/alerta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerta: true })
      }).catch(err => console.error("Error enviando alerta al Arduino:", err));
    } else if (nuevoEstadoDonador === 'no entregada') {
      estatusEntrega = 'cancelada';
    }

    await ref.update({ estatusEntrega });

    return {
      status: 'success',
      message: body.entregada
        ? 'Donación marcada como entregada. El beneficiario ahora debe confirmar.'
        : 'Donación marcada como no entregada.',
    };
  }

  // Rechazar manualmente (fallback)
  @Patch('rechazar-solicitud/:id')
  async rechazarSolicitud(
    @Param('id') id: string,
    @Body() body: { motivo?: string },
  ) {
    const db = this.firebaseService.getFirestore();
    const ref = db.collection('solicitudAlimentos').doc(id);

    const doc = await ref.get();
    if (!doc.exists)
      return { status: 'error', message: 'Solicitud no encontrada' };

    await ref.update({
      estatusSolicitud: 'rechazado',
      observacion: body.motivo || '',
      fechaRevision: new Date().toISOString(),
    });

    return { status: 'success', message: 'Solicitud rechazada correctamente' };
  }
}
