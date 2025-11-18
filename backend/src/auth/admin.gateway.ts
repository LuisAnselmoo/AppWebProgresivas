import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FirebaseService } from './firebase.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class AdminGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(private readonly firebaseService: FirebaseService) {}

  afterInit() {
    const db = this.firebaseService.getFirestore();

    // Escuchar en tiempo real las colecciones
    db.collection('solicitudAlimentos').onSnapshot((snapshot) => {
      this.emitirActualizacion('beneficiarios', snapshot);
    });

    db.collection('solicitudDonacion').onSnapshot((snapshot) => {
      this.emitirActualizacion('donadores', snapshot);
    });
  }

  private emitirActualizacion(tipo: 'beneficiarios' | 'donadores', snapshot: any) {
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Emitir solo las pendientes para el panel
    const pendientes =
      tipo === 'beneficiarios'
        ? docs.filter((d) => d.estatusSolicitud === 'pendiente')
        : docs.filter((d) => d.estatusDonacion === 'pendiente');

    this.server.emit('solicitudesActualizadas', { tipo, pendientes });
  }
}
