import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { FirebaseService } from '../auth/firebase.service';

@Controller('admin/preguntas-juego')
export class PreguntasJuegoController {
  constructor(private readonly firebaseService: FirebaseService) {}

  // Obtener todas las preguntas
  @Get()
  async obtenerPreguntas() {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db.collection('preguntasJuego').get();

    const preguntas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { status: 'success', data: preguntas };
  }

  // Registrar nueva pregunta
  @Post()
  async crearPregunta(
    @Body()
    body: { Pregunta: string; Opciones: string[]; Correcta: number; Nivel: number },
  ) {
    const db = this.firebaseService.getFirestore();
    const ref = await db.collection('preguntasJuego').add(body);
    return { status: 'success', id: ref.id, message: 'Pregunta creada correctamente.' };
  }

  // Actualizar pregunta existente
  @Patch(':id')
  async actualizarPregunta(
    @Param('id') id: string,
    @Body() body: Partial<{ Pregunta: string; Opciones: string[]; Correcta: number; Nivel: number }>,
  ) {
    const db = this.firebaseService.getFirestore();
    await db.collection('preguntasJuego').doc(id).update(body);
    return { status: 'success', message: 'Pregunta actualizada correctamente.' };
  }

  // Eliminar pregunta
  @Delete(':id')
  async eliminarPregunta(@Param('id') id: string) {
    const db = this.firebaseService.getFirestore();
    await db.collection('preguntasJuego').doc(id).delete();
    return { status: 'success', message: 'Pregunta eliminada correctamente.' };
  }
}
