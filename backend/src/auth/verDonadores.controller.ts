import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { FirebaseService } from "./firebase.service";

@Controller('verDonadores')
export class verDonadoresController {
    constructor(private readonly firebaseService: FirebaseService) { }


    // traer los datos
    @Get('usuarios')
    async obtenerDonadores() {
        const db = this.firebaseService.getFirestore();
        const snapshot = await db
            .collection('usuarios')
            .where('rol', '==', 'donador')
            .get();

        if (snapshot.empty) {
            return { status: 'success', data: [] };
        }

        const solicitudes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { status: 'success', data: solicitudes };
    }

    @Get('misChats/:uid')
    async getChats(@Param('uid') uid: string) {
        const db = this.firebaseService.getFirestore();

        // Traer los chats donde participa el usuario
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

            // Buscar el otro participante (el que no es el usuario actual)
            const remotoUid = participantes.find((p: string) => p !== uid);

            // Intentar obtener su info desde la colección 'usuarios'
            let remotoNombre = 'Usuario';
            if (remotoUid) {
                try {
                    const userSnap = await db.collection('usuarios').doc(remotoUid).get();
                    if (userSnap.exists) {
                        const userData = userSnap.data();
                        remotoNombre =
                            userData?.nombreEmpresa ||
                            userData?.nombre ||
                            userData?.correo ||
                            'Usuario';
                    }
                } catch (err) {
                    // console.warn(`No se pudo obtener info del usuario ${remotoUid}`);
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
