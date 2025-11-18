import { Controller, Get, Param } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('verBeneficiarios')
export class VerBeneficiariosController {
  constructor(private readonly firebaseService: FirebaseService) {}

  // Listar todos los beneficiarios
  @Get('usuarios')
  async obtenerBeneficiarios() {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('usuarios')
      .where('rol', '==', 'beneficiario')
      .get();

    if (snapshot.empty) {
      return { status: 'success', data: [] };
    }

    const beneficiarios = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { status: 'success', data: beneficiarios };
  }

  // Obtener los chats del donador (con nombre del beneficiario)
  @Get('misChats/:uid')
  async getChats(@Param('uid') uid: string) {
    const db = this.firebaseService.getFirestore();

    // Buscar los chats donde participa el donador
    const snapshot = await db
      .collection('chats')
      .where('participantes', 'array-contains', uid)
      .orderBy('ultimaActividad', 'desc')
      .get();

    if (snapshot.empty) return [];

    const chats: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const participantes = data.participantes || [];

      // Obtener el otro participante (beneficiario)
      const remotoUid = participantes.find((p: string) => p !== uid);

      let remotoNombre = 'Beneficiario';
      if (remotoUid) {
        try {
          const userSnap = await db.collection('usuarios').doc(remotoUid).get();
          if (userSnap.exists) {
            const userData = userSnap.data();
            remotoNombre = [
              userData?.nombre,
              userData?.apellidoPaterno,
              userData?.apellidoMaterno,
            ]
              .filter(Boolean)
              .join(' ') || userData?.correo || 'Beneficiario';
          }
        } catch (err) {
          // console.warn(`Error al obtener datos del beneficiario ${remotoUid}`);
        }
      }

      chats.push({
        id: doc.id,
        ...data,
        nombreRemoto: remotoNombre,
      });
    }

    return chats;
  }
}
