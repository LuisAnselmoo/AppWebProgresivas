import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('admin')
export class HomeAdminController {
  constructor(private readonly firebaseService: FirebaseService) { }

  // Obtener todas las pendientes sin asignación
  @Get('solicitudes/pendientes')
  async obtenerPendientes() {
    const db = this.firebaseService.getFirestore();

    // Solicitudes de alimentos (beneficiarios) pendientes y sin donador asignado
    const alimentosSnap = await db
      .collection('solicitudAlimentos')
      .where('estatusSolicitud', '==', 'pendiente')
      .get();

    const beneficiarios = alimentosSnap.docs
      .map((doc) => {
        const data = doc.data();

        const tieneDonador =
          data.donadorAsignado ||
          data.donadorId ||
          data.donadorAsignadoId ||
          data.idDonador ||
          data.nombreDonadorAsignado;

        // Solo incluir si NO tiene ningún tipo de asignación
        if (!tieneDonador) {
          return {
            tipo: 'beneficiario',
            id: doc.id,
            ...data,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    // Solicitudes de donación pendientes y sin beneficiario asignado
    const donacionesSnap = await db
      .collection('solicitudDonacion')
      .where('estatusDonacion', '==', 'pendiente')
      .get();

    const donadores = donacionesSnap.docs
      .map((doc) => {
        const data = doc.data();

        const tieneBeneficiario =
          data.beneficiarioAsignado ||
          data.beneficiarioId ||
          data.beneficiarioAsignadoId ||
          data.idBeneficiario ||
          data.nombreBeneficiarioAsignado;

        // Solo incluir si NO tiene ningún tipo de asignación
        if (!tieneBeneficiario) {
          return {
            tipo: 'donador',
            id: doc.id,
            ...data,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    return { status: 'success', data: { beneficiarios, donadores } };
  }



  //Ver detalle por ID
  @Get('solicitud/:tipo/:id')
  async verDetalle(
    @Param('tipo') tipo: 'beneficiario' | 'donador',
    @Param('id') id: string,
  ) {
    const db = this.firebaseService.getFirestore();
    const collectionName =
      tipo === 'beneficiario' ? 'solicitudAlimentos' : 'solicitudDonacion';

    const doc = await db.collection(collectionName).doc(id).get();
    if (!doc.exists)
      return { status: 'error', message: 'Solicitud no encontrada' };

    return { status: 'success', data: { id: doc.id, ...doc.data() } };
  }

  // Actualizar estado (aprobado / rechazado)
  @Patch('solicitud/:tipo/:id')
  async actualizarEstado(
    @Param('tipo') tipo: 'beneficiario' | 'donador',
    @Param('id') id: string,
    @Body() body: { nuevoEstado: string; observacion?: string; adminId?: string },
  ) {
    const db = this.firebaseService.getFirestore();
    const { nuevoEstado, observacion, adminId } = body;

    if (!['aprobado', 'rechazado', 'pendiente'].includes(nuevoEstado)) {
      return { status: 'error', message: 'Estado no válido' };
    }

    const collectionName =
      tipo === 'beneficiario' ? 'solicitudAlimentos' : 'solicitudDonacion';
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists)
      return { status: 'error', message: 'Solicitud no encontrada' };

    const updateData: any = {
      observacion: observacion || '',
      fechaRevision: new Date().toISOString(),
      adminAprobo: adminId || 'admin-desconocido',
    };

    if (tipo === 'beneficiario') {
      updateData.estatusSolicitud = nuevoEstado;
    } else {
      updateData.estatusDonacion = nuevoEstado;
    }

    await docRef.update(updateData);

    return {
      status: 'success',
      message: `Solicitud ${nuevoEstado} correctamente`,
    };
  }


  // Aprobadas (para otras vistas)
  @Get('solicitudes/aprobadas')
  async obtenerAprobadas() {
    const db = this.firebaseService.getFirestore();

    const alimentosSnap = await db
      .collection('solicitudAlimentos')
      .where('estatusSolicitud', '==', 'aprobado')
      .get();

    const donacionesSnap = await db
      .collection('solicitudDonacion')
      .where('estatusDonacion', '==', 'aprobado')
      .get();

    const beneficiarios = alimentosSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        tipo: 'beneficiario',
        id: doc.id,
        nombre: data.nombre,
        apellidoPaterno: data.apellidoPaterno,
        diaPreferido: data.diaPreferido,
        fechaRevision: data.fechaRevision,
        modalidad: data.modalidad || 'Entrega directa',
        productos: data.productos || [],
      };
    });

    const donadores = donacionesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        tipo: 'donador',
        id: doc.id,
        nombre: data.nombre,
        apellidoPaterno: data.apellidoPaterno,
        fechaRecoleccion: data.fechaRecoleccion,
        fechaRevision: data.fechaRevision,
        modalidad: data.modalidad || 'Recolección',
        productos: data.productos || [],
      };
    });

    return { status: 'success', data: { beneficiarios, donadores } };
  }

  // Solicitudes aprobadas por un administrador específico
  @Get('solicitudes/aprobadas/:adminId')
  async obtenerAprobadasPorAdmin(@Param('adminId') adminId: string) {
    const db = this.firebaseService.getFirestore();

    const alimentosSnap = await db
      .collection('solicitudAlimentos')
      .where('estatusSolicitud', '==', 'aprobado')
      .where('adminAprobo', '==', adminId)
      .get();

    const donacionesSnap = await db
      .collection('solicitudDonacion')
      .where('estatusDonacion', '==', 'aprobado')
      .where('adminAprobo', '==', adminId)
      .get();

    const beneficiarios = alimentosSnap.docs.map((doc) => ({
      tipo: 'beneficiario',
      id: doc.id,
      ...doc.data(),
    }));

    const donadores = donacionesSnap.docs.map((doc) => ({
      tipo: 'donador',
      id: doc.id,
      ...doc.data(),
    }));

    return { status: 'success', data: { beneficiarios, donadores } };
  }

  // Nuevo endpoint
  @Get('solicitudes/todas')
  async obtenerTodas() {
    const db = this.firebaseService.getFirestore();

    // Beneficiarios
    const alimentosSnap = await db.collection('solicitudAlimentos').get();
    const beneficiarios = alimentosSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        tipo: 'beneficiario',
        ...data,
        nombreAsignado: data.donadorAsignado
          ? data.nombreDonador || null
          : null,
      };
    });

    // Donadores
    const donacionesSnap = await db.collection('solicitudDonacion').get();
    const donadores = donacionesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        tipo: 'donador',
        ...data,
        nombreAsignado: data.beneficiarioAsignado
          ? data.nombreBeneficiario || null
          : null,
      };
    });

    return { status: 'success', data: { beneficiarios, donadores } };
  }


}
