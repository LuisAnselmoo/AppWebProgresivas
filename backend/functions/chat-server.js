const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

function startChatServer(admin) {
  const db = admin.firestore();
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const usuariosConectados = new Map();

  io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado:", socket.id);

    socket.on("registrarUsuario", (data) => {
      usuariosConectados.set(data.uid, socket.id);
      console.log(`Usuario ${data.uid} registrado`);
    });

    socket.on("unirseChat", async (data) => {
      socket.join(data.chatId);
      const mensajesSnap = await db
        .collection("chats")
        .doc(data.chatId)
        .collection("mensajes")
        .orderBy("fecha", "asc")
        .get();
      const historial = mensajesSnap.docs.map((d) => d.data());
      socket.emit("historialMensajes", { chatId: data.chatId, mensajes: historial });
    });

    socket.on("enviarMensaje", async (data) => {
      const chatRef = db.collection("chats").doc(data.chatId);
      const mensajesRef = chatRef.collection("mensajes");
      await mensajesRef.add({
        texto: data.texto,
        remitenteUid: data.remitenteUid,
        fecha: new Date(),
      });

      const partes = data.chatId.split("_");
      await chatRef.set(
        {
          participantes: partes,
          ultimaActividad: new Date(),
          ultimoMensaje: data.texto,
        },
        { merge: true }
      );

      for (const uid of partes) {
        const socketId = usuariosConectados.get(uid);
        if (socketId) io.to(socketId).emit("nuevoMensaje", data);
      }
    });

    socket.on("usuarioEscribiendo", (data) => {
      const partes = data.chatId.split("_");
      for (const uid of partes) {
        if (uid !== data.remitenteUid) {
          const socketId = usuariosConectados.get(uid);
          if (socketId) io.to(socketId).emit("usuarioEscribiendo", data);
        }
      }
    });

    socket.on("disconnect", () => {
      for (const [uid, sid] of usuariosConectados.entries()) {
        if (sid === socket.id) usuariosConectados.delete(uid);
      }
      console.log("🔴 Cliente desconectado:", socket.id);
    });
  });

  // 🟢 Solo iniciar manualmente si estás corriendo local
  if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === "development") {
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`💬 Chat server local corriendo en puerto ${PORT}`);
    });
  } else {
    console.log("⚙️ Chat server iniciado dentro de Firebase Functions (sin .listen())");
  }

  return io;
}

module.exports = { startChatServer };
