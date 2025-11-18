import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FirebaseService } from '../auth/firebase.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private usuariosConectados = new Map<string, string>(); // uid -> socketId

  constructor(private readonly firebaseService: FirebaseService) {
    const db = this.firebaseService.getFirestore();

    // Escucha todos los "mensajes" nuevos creados en cualquier chat
    db.collectionGroup('mensajes').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const chatId = change.doc.ref.parent.parent?.id; // ID del chat

          if (data.origen === 'gateway') return;

          if (!chatId || !data.remitenteUid || !data.texto) return;

          // console.log(`Nuevo mensaje detectado en Firestore → chat ${chatId}`);

          //  Avisar solo a los demás (no al remitente)
          // const partes = chatId.split('_');
          // for (const uid of partes) {
          //   if (uid !== data.remitenteUid) {
          //     const socketId = this.usuariosConectados.get(uid);
          //     if (socketId) {
          //       console.log(`Enviando nuevoMensaje a usuario ${uid}`);
          //       this.server.to(socketId).emit('nuevoMensaje', {
          //         chatId,
          //         remitenteUid: data.remitenteUid,
          //         texto: data.texto,
          //       });
          //     }
          //   }
          // }
          // Dentro del listener de Firestore (constructor)
          const partes = chatId.split('_');
          for (const uid of partes) {
            if (uid !== data.remitenteUid) {
              // this.server.to(socketId).emit(...)  
              this.server.to(uid).emit('nuevoMensaje', {
                chatId,
                remitenteUid: data.remitenteUid,
                texto: data.texto,
              });
            }
          }
        }
      });
    });

  }

  handleConnection(client: Socket) {
    // console.log('Cliente conectado:', client.id);
  }

  handleDisconnect(client: Socket) {
    // quitar el usuario que se desconecta
    for (const [uid, socketId] of this.usuariosConectados.entries()) {
      if (socketId === client.id) {
        this.usuariosConectados.delete(uid);
        break;
      }
    }
    // console.log('Cliente desconectado:', client.id);
  }

  // Registrar al usuario con su UID (al conectar desde el frontend)
  // @SubscribeMessage('registrarUsuario')
  // handleRegistrar(@MessageBody() data: { uid: string }, @ConnectedSocket() client: Socket) {
  //   this.usuariosConectados.set(data.uid, client.id);
  //   console.log(`Usuario ${data.uid} registrado con socket ${client.id}`);
  // }
  @SubscribeMessage('registrarUsuario')
  handleRegistrar(
    @MessageBody() data: { uid: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.uid) {
      // console.warn(`registrarUsuario sin uid desde socket ${client.id}`);
      return;
    }

    // guarda referencia (opcional) y únete al room del uid
    this.usuariosConectados.set(data.uid, client.id);
    client.join(data.uid);

    // console.log(`Usuario ${data.uid} registrado con socket ${client.id} y unido al room ${data.uid}`);
  }


  // Cuando alguien envía un mensaje
  @SubscribeMessage('enviarMensaje')
  async handleMessage(
    @MessageBody()
    data: { chatId: string; remitenteUid: string; texto: string },
  ) {
    const db = this.firebaseService.getFirestore();
    const chatRef = db.collection('chats').doc(data.chatId);
    const mensajesRef = chatRef.collection('mensajes');

    await mensajesRef.add({
      texto: data.texto,
      remitenteUid: data.remitenteUid,
      fecha: new Date(),
      // origen: 'socket',
      origen: 'gateway',
    });

    const partes = data.chatId.split('_'); // los 2 UID de los participantes
    await chatRef.set(
      {
        participantes: partes,
        ultimaActividad: new Date(),
        ultimoMensaje: data.texto,
      },
      { merge: true },
    );

    // Emitir al remitente y al receptor directamente
    // for (const uid of partes) {
    //   const socketId = this.usuariosConectados.get(uid);
    //   if (socketId) {
    //     this.server.to(socketId).emit('nuevoMensaje', data);
    //   }
    // }
    // Dentro de handleMessage (cuando te llega por socket desde web)
    for (const uid of partes) {
      this.server.to(uid).emit('nuevoMensaje', data);
    }

  }

  // Cuando un usuario entra a un chat (abre conversación)
  @SubscribeMessage('unirseChat')
  async handleJoin(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.chatId);
    // console.log(`Cliente ${client.id} se unió al chat ${data.chatId}`);

    const db = this.firebaseService.getFirestore();
    const mensajesRef = db.collection('chats').doc(data.chatId).collection('mensajes');
    const snapshot = await mensajesRef.orderBy('fecha', 'asc').get();

    const historial = snapshot.docs.map((doc) => doc.data());
    client.emit('historialMensajes', { chatId: data.chatId, mensajes: historial });
  }


  // NUEVO: indicador "escribiendo..."
  @SubscribeMessage('usuarioEscribiendo')
  handleTyping(
    @MessageBody() data: { chatId: string; remitenteUid: string },
    @ConnectedSocket() client: Socket,
  ) {
    const partes = data.chatId.split('_');
    for (const uid of partes) {
      if (uid !== data.remitenteUid) {
        const socketId = this.usuariosConectados.get(uid);
        if (socketId) {
          this.server.to(socketId).emit('usuarioEscribiendo', {
            chatId: data.chatId,
            remitenteUid: data.remitenteUid,
          });
        }
      }
    }
  }
}
