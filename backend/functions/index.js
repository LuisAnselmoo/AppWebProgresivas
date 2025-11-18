const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { startChatServer } = require("./chat-server.js"); // Importa el chat

// Inicializa Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

/* LOGIN y REGISTRO */
app.post("/auth/register", async (req, res) => {
  const body = req.body;
  const { correo, pass1, tipoUsuario } = body;

  try {
    // Verificar si ya existe el correo
    try {
      const existingUser = await auth.getUserByEmail(correo);
      if (existingUser) {
        return res.status(400).json({ status: "error", message: "El correo ya está registrado" });
      }
    } catch (e) {
      // Ignorar error si el usuario no existe
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email: correo,
      password: pass1,
      displayName: body.nombre,
    });

    const usuarioData = {
      nombre: body.nombre,
      apellidoPaterno: body.apellidoPaterno,
      apellidoMaterno: body.apellidoMaterno,
      correo: body.correo,
      telefono: body.telefono,
      tipoUsuario,
      rol: tipoUsuario,
      fechaCreacion: new Date().toISOString(),

      // Beneficiario
      tipoBeneficiario: body.tipoBeneficiario || null,
      nombreBeneficiario: body.nombreBeneficiario || null,
      curpRfcBeneficiario: body.curpRfcBeneficiario || null,

      // Donador
      tipoDonador: body.tipoDonador || null,
      nombreEmpresa: body.nombreEmpresa || null,
      rfcEmpresa: body.rfcEmpresa || null,
      nombreRepresentante: body.nombreRepresentante || null,
      cargoRepresentante: body.cargoRepresentante || null,
      contactoAlterno: body.contactoAlterno || null,
      correoAlterno: body.correoAlterno || null,

      // Dirección
      calle: body.calle || null,
      numExterior: body.numExterior || null,
      numInterior: body.numInterior || null,
      colonia: body.colonia || null,
      codigoPostal: body.codigoPostal || null,
      municipio: body.municipio || null,
      estado: body.estado || null,
      referencias: body.referencias || null,
    };

    // Guardar datos en Firestore
    await db.collection("usuarios").doc(userRecord.uid).set(usuarioData);

    console.log("Usuario registrado correctamente:", userRecord.uid);
    return res.status(200).json({
      status: "success",
      message: "Usuario registrado correctamente",
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error("Error al registrar:", error);
    let message = "Error desconocido";
    if (error.code === "auth/email-already-exists") message = "El correo ya está registrado";
    else if (error.code === "auth/invalid-email") message = "Correo inválido";
    else if (error.code === "auth/invalid-password") message = "Contraseña no válida";
    return res.status(500).json({ status: "error", message });
  }
});

/* ogin de usuarios */

app.post("/auth/login", async (req, res) => {
  const { correo, password, rolSeleccionado } = req.body;

  try {
    const userSnap = await db.collection("usuarios").where("correo", "==", correo).limit(1).get();

    if (userSnap.empty) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }

    const userData = userSnap.docs[0].data();
    const uid = userSnap.docs[0].id;

    // Validar rol
    const userRole = userData.rol || "beneficiario";
    if (rolSeleccionado && rolSeleccionado !== userRole) {
      return res.status(403).json({
        status: "error",
        message: `No tienes permisos como ${rolSeleccionado}`,
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { uid, correo, rol: userRole },
      "clave_secreta_demo",
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      status: "success",
      message: "Login exitoso",
      uid,
      rol: userRole,
      token,
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
});

/* SOLICITUDES DE DONACIÓN */

app.get("/solicitudDonacion/usuario/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    console.log("Buscando donaciones del usuario:", uid);

    const snapshot = await db
      .collection("solicitudDonacion")
      .where("uid", "==", uid)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ status: "success", data: [] });
    }

    const donaciones = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`${donaciones.length} donaciones encontradas.`);
    return res.status(200).json({ status: "success", data: donaciones });
  } catch (error) {
    console.error("Error al obtener donaciones:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno al obtener donaciones",
      error: error.message,
    });
  }
});

app.post("/solicitudDonacion", async (req, res) => {
  try {
    const donacion = req.body;
    console.log("Donación recibida:", donacion);

    if (!donacion.uid) {
      return res.status(400).json({
        status: "error",
        message: "Falta UID del usuario",
      });
    }

    const ref = await db.collection("solicitudDonacion").add({
      ...donacion,
      fechaRegistro: new Date().toISOString(),
      estatusDonacion: "pendiente",
    });

    console.log("Donación registrada con ID:", ref.id);
    res.status(200).json({
      status: "success",
      message: "Donación registrada correctamente",
      id: ref.id,
    });
  } catch (error) {
    console.error("Error al registrar donación:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno al registrar donación",
      error: error.message,
    });
  }
});

/* SOLICITUDES DE ALIMENTO */

app.get("/solicitudAlimento/usuario/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    console.log("UID recibido:", uid);

    const snapshot = await db
      .collection("solicitudAlimentos")
      .where("uid", "==", uid)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ status: "success", data: [] });
    }

    const solicitudes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ status: "success", data: solicitudes });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message,
    });
  }
});

app.post("/solicitudAlimento", async (req, res) => {
  try {
    const solicitud = req.body;
    if (!solicitud.uid) {
      return res
        .status(400)
        .json({ status: "error", message: "Falta UID del usuario" });
    }

    const ref = await db.collection("solicitudAlimentos").add({
      ...solicitud,
      fechaRegistro: new Date().toISOString(),
      estado: "pendiente",
    });

    res.status(200).json({
      status: "success",
      message: "Solicitud registrada correctamente",
      id: ref.id,
    });
  } catch (error) {
    console.error("Error al registrar solicitud:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno al registrar solicitud",
      error: error.message,
    });
  }
});

/* OBTENER DATOS DEL USUARIO */
app.get("/usuarios/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    console.log("Buscando usuario con UID:", uid);

    const userDoc = await db.collection("usuarios").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      status: "success",
      data: userDoc.data(),
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener usuario",
      error: error.message,
    });
  }
});

/* 🔹 Ver todos los donadores (para los beneficiarios) */
app.get("/verDonadores/usuarios", async (req, res) => {
  try {
    const snapshot = await db.collection("usuarios").where("rol", "==", "donador").get();

    const donadores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      status: "success",
      data: donadores,
    });
  } catch (error) {
    console.error("Error al obtener donadores:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener donadores",
      error: error.message,
    });
  }
});

/* 🔹 Ver los chats activos del usuario */
app.get("/verDonadores/misChats/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const chatsSnap = await db.collection("chats")
      .where("participantes", "array-contains", uid)
      .orderBy("ultimaActividad", "desc")
      .get();

    const chats = chatsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(chats);
  } catch (error) {
    console.error("Error al obtener chats:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener chats",
      error: error.message,
    });
  }
});


startChatServer(admin); // lo inicializa desde el mismo entorno

/* Exportar la API */
exports.api = functions.https.onRequest(app);
