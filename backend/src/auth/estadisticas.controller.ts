import { Controller, Get } from '@nestjs/common';
import { FirebaseService } from '../auth/firebase.service';

@Controller('admin/estadisticas')
export class EstadisticasController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Get('entregas-finalizadas')
  async obtenerEntregasFinalizadas() {
    const db = this.firebaseService.getFirestore();

    // Solicitudes de alimentos completadas
    const solicitudesSnap = await db
      .collection('solicitudAlimentos')
      .where('estatusEntregaDonador', '==', 'entregada')
      .where('estatusEntregaBeneficiario', '==', 'recibida')
      .get();

    const donacionesSnap = await db
      .collection('solicitudDonacion')
      .where('estatusEntregaDonador', '==', 'entregada')
      .where('estatusEntregaBeneficiario', '==', 'recibida')
      .get();

    return {
      status: 'success',
      data: {
        solicitudesCompletas: solicitudesSnap.size,
        donacionesCompletas: donacionesSnap.size,
      },
    };
  }
}
