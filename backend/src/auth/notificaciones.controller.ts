import { Controller, Get, Param, Patch } from '@nestjs/common';
import { FirebaseService } from '../auth/firebase.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly firebaseService: FirebaseService) {}

  // Obtener todas las notificaciones del usuario
  @Get(':uid')
  async obtenerNotificaciones(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('notificaciones')
      .where('uid', '==', uid)
      .orderBy('fechaCreacion', 'desc')
      .get();

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { status: 'success', data };
  }

  // Marcar todas como vistas
  @Patch('marcar-vistas/:uid')
  async marcarVistas(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('notificaciones')
      .where('uid', '==', uid)
      .get();

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { visto: true });
    });

    await batch.commit();

    return { status: 'success', message: 'Notificaciones marcadas como vistas' };
  }
}
