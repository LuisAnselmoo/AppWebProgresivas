import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FirebaseService } from './firebase.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificacionesGateway {
  @WebSocketServer()
  server: Server;

  private usuariosConectados = new Map<string, string>();

  constructor(private readonly firebaseService: FirebaseService) {
    const db = this.firebaseService.getFirestore();

    // Listener para solicitudes de alimentos (Beneficiarios)
    db.collection('solicitudAlimentos').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() || {};
        const id = change.doc.id;
        const beneficiarioId = data.uid || data.beneficiarioAsignado;
        const donadorId = data.donadorAsignado;

        // NUEVA SOLICITUD
        if (change.type === 'added') {
          if (beneficiarioId) {
            this.server.to(beneficiarioId).emit('nuevaSolicitud', {
              tipo: 'beneficiario',
              mensaje: 'Has creado una nueva solicitud de alimentos',
              id,
              fecha: new Date().toISOString(),
            });
          }

          if (donadorId) {
            this.server.to(donadorId).emit('nuevaSolicitud', {
              tipo: 'donador',
              mensaje: 'Se te ha asignado una nueva solicitud de alimentos',
              id,
              fecha: new Date().toISOString(),
            });

            db.collection('notificaciones').add({
              uid: donadorId,
              tipo: 'donador',
              mensaje: 'Se te ha asignado una nueva solicitud de alimentos',
              visto: false,
              fechaCreacion: new Date().toISOString(),
            });
          }
        }

        // MODIFICADA (aprobada / rechazada / entregas)
        if (change.type === 'modified') {
          const estado = data.estatusSolicitud;

          // Cambio general (aprobado / rechazado)
          if (['aprobado', 'rechazado'].includes(estado)) {
            if (beneficiarioId)
              this.server.to(beneficiarioId).emit('solicitudActualizada', {
                tipo: 'beneficiario',
                nuevoEstado: estado,
                id,
              });

            if (donadorId)
              this.server.to(donadorId).emit('solicitudActualizada', {
                tipo: 'donador',
                nuevoEstado: estado,
                id,
              });

            db.collection('notificaciones').add({
              uid: beneficiarioId,
              tipo: 'beneficiario',
              mensaje:
                estado === 'aprobado'
                  ? 'Tu solicitud de alimentos ha sido aprobada'
                  : 'Tu solicitud fue rechazada',
              visto: false,
              fechaCreacion: new Date().toISOString(),
            });
          }

          // Actualización de entrega (en curso / finalizada / cancelada)
          if (
            data.estatusEntrega ||
            data.estatusEntregaDonador ||
            data.estatusEntregaBeneficiario
          ) {
            const payload = {
              id,
              tipo: 'solicitud',
              estatusEntrega: data.estatusEntrega || 'en curso',
              estatusEntregaDonador: data.estatusEntregaDonador || 'pendiente',
              estatusEntregaBeneficiario:
                data.estatusEntregaBeneficiario || 'pendiente',
              mensaje: 'Actualización de entrega de solicitud',
            };

            if (beneficiarioId)
              this.server.to(beneficiarioId).emit('entregaActualizada', payload);
            if (donadorId)
              this.server.to(donadorId).emit('entregaActualizada', payload);
          }
        }

        // ELIMINADA
        if (change.type === 'removed' && beneficiarioId) {
          this.server.to(beneficiarioId).emit('solicitudEliminada', {
            tipo: 'beneficiario',
            id,
            mensaje: 'Una de tus solicitudes de alimentos fue eliminada.',
          });
        }
      });
    });

    // Listener para donaciones (Donadores)
    db.collection('solicitudDonacion').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() || {};
        const id = change.doc.id;
        const donadorId = data.uid || data.donadorAsignado;
        const beneficiarioId =
          data.beneficiarioAsignado || data.uidBeneficiario || null;

        // NUEVA DONACIÓN
        if (change.type === 'added') {
          if (donadorId) {
            this.server.to(donadorId).emit('nuevaSolicitud', {
              tipo: 'donador',
              mensaje: 'Has registrado una nueva donación de alimentos',
              id,
              fecha: new Date().toISOString(),
            });
          }

          if (beneficiarioId) {
            this.server.to(beneficiarioId).emit('nuevaSolicitud', {
              tipo: 'beneficiario',
              mensaje: 'Has recibido una nueva donación asignada',
              id,
              fecha: new Date().toISOString(),
            });

            db.collection('notificaciones').add({
              uid: beneficiarioId,
              tipo: 'beneficiario',
              mensaje: 'Has recibido una nueva donación asignada',
              visto: false,
              fechaCreacion: new Date().toISOString(),
            });
          }
        }

        // MODIFICADA (aprobada / rechazada / entregas)
        if (change.type === 'modified') {
          const estado = data.estatusDonacion;

          // Cambio general (aprobado / rechazado)
          if (['aprobado', 'rechazado'].includes(estado)) {
            if (donadorId)
              this.server.to(donadorId).emit('solicitudActualizada', {
                tipo: 'donador',
                nuevoEstado: estado,
                id,
              });

            if (beneficiarioId)
              this.server.to(beneficiarioId).emit('solicitudActualizada', {
                tipo: 'beneficiario',
                nuevoEstado: estado,
                id,
              });

            db.collection('notificaciones').add({
              uid: donadorId,
              tipo: 'donador',
              mensaje:
                estado === 'aprobado'
                  ? 'Tu donación ha sido aprobada'
                  : 'Tu donación fue rechazada',
              visto: false,
              fechaCreacion: new Date().toISOString(),
            });
          }

          // Actualización de entrega sincronizada
          if (
            data.estatusEntrega ||
            data.estatusEntregaDonador ||
            data.estatusEntregaBeneficiario
          ) {
            const payload = {
              id,
              tipo: 'donacion',
              estatusEntrega: data.estatusEntrega || 'en curso',
              estatusEntregaDonador:
                data.estatusEntregaDonador || 'pendiente',
              estatusEntregaBeneficiario:
                data.estatusEntregaBeneficiario || 'pendiente',
              mensaje: 'Actualización de entrega de donación',
            };

            if (donadorId)
              this.server.to(donadorId).emit('entregaActualizada', payload);
            if (beneficiarioId)
              this.server.to(beneficiarioId).emit('entregaActualizada', payload);
          }
        }

        // ELIMINADA
        if (change.type === 'removed' && donadorId) {
          this.server.to(donadorId).emit('solicitudEliminada', {
            tipo: 'donador',
            id,
            mensaje: 'Una de tus donaciones fue eliminada.',
          });
        }
      });
    });
  }

  // Registro de usuario en canal WebSocket
  @SubscribeMessage('registrarUsuario')
  handleRegistrar(
    @MessageBody() data: { uid: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.uid) return;
    this.usuariosConectados.set(data.uid, client.id);
    client.join(data.uid);
    // console.log(`Usuario ${data.uid} conectado al canal de notificaciones`);
  }
}
