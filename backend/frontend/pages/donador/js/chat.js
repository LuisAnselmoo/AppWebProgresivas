import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

// const socket = io("http://localhost:3000");

// Detectar si estamos en producción o desarrollo
const backendURL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://ecomarket-app-875050427327.us-central1.run.app";

// Importante: usar wss:// en producción automáticamente
const socket = io(backendURL, {
  transports: ["websocket"],
  withCredentials: true,
});


const userData = JSON.parse(localStorage.getItem("userData")) || {};
const userId = userData.uid;
const userRol = userData.rol || "donador";
const userNombre = userData.nombre || "Donador";

socket.emit("registrarUsuario", { uid: userId });

let mensajesNuevos = 0;
let chatsActivos = {};
let chatAbiertoId = null;
let escribirTimer = null;

function guardarChatsLocal() {
  localStorage.setItem("chatsActivos", JSON.stringify(chatsActivos));
}

// Reintentar registro si se reconecta
socket.io.on("reconnect", () => {
  if (userId) socket.emit("registrarUsuario", { uid: userId });
});

// Al cargar
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const cacheChats = localStorage.getItem("chatsActivos");
    if (cacheChats) {
      chatsActivos = JSON.parse(cacheChats);
      actualizarNotificacion();
    }

    const res = await fetch(`/api/verBeneficiarios/misChats/${userId}`);
    const chats = await res.json();

    if (Array.isArray(chats)) {
      chats.forEach((chat) => {
        const id = chat.id;
        chatsActivos[id] = chatsActivos[id] || {};
        const nombreRemoto = chat.nombreRemoto || chatsActivos[id].nombre || "Beneficiario";
        chatsActivos[id].nombre = nombreRemoto;
        chatsActivos[id].ultimoMensaje = chat.ultimoMensaje || chatsActivos[id].ultimoMensaje || "";
        chatsActivos[id].mensajes = chatsActivos[id].mensajes || [];
        chatsActivos[id].vistos = chatsActivos[id].vistos ?? true;
      });
      guardarChatsLocal();
      actualizarNotificacion();
    }
  } catch (err) {
    // console.error("Error al cargar chats:", err);
  }
});

export function abrirChat(remotoId, remotoNombre) {
  const chatId = generarChatId(userId, remotoId);
  chatAbiertoId = chatId;
  mensajesNuevos = 0;
  actualizarNotificacion();

  let listener, typingListener;

  Swal.fire({
    title: `Chat con ${remotoNombre}`,
    html: `
      <div id="chatBox" class="chat-box"></div>
      <div id="typingIndicator" class="typing-indicator"></div>
      <input id="msgInput" class="chat-input" placeholder="Escribe un mensaje...">
    `,
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: async () => {
      const chatBox = document.getElementById("chatBox");
      const input = document.getElementById("msgInput");
      const typingIndicator = document.getElementById("typingIndicator");

      chatsActivos[chatId] = chatsActivos[chatId] || {
        nombre: remotoNombre,
        mensajes: [],
        vistos: true,
      };

      socket.emit("unirseChat", { chatId });

      socket.once("historialMensajes", (data) => {
        if (data.chatId !== chatId) return;
        chatBox.innerHTML = "";
        data.mensajes.forEach((msg) => agregarMensaje(chatBox, msg, userId));
        chatBox.scrollTop = chatBox.scrollHeight;
      });

      listener = (msg) => {
        if (msg.chatId !== chatId) return;
        agregarMensaje(chatBox, msg, userId);
        playSound();
        chatsActivos[chatId].mensajes.push(msg);
        chatsActivos[chatId].vistos = true;
        guardarChatsLocal();
        chatBox.scrollTop = chatBox.scrollHeight;
        actualizarNotificacion();
      };
      socket.on("nuevoMensaje", listener);

      // Indicador "escribiendo..."
      typingListener = (data) => {
        if (data.chatId !== chatId || data.remitenteUid === userId) return;
        typingIndicator.textContent = `${remotoNombre} está escribiendo...`;
        clearTimeout(escribirTimer);
        escribirTimer = setTimeout(() => (typingIndicator.textContent = ""), 2000);
      };
      socket.on("usuarioEscribiendo", typingListener);

      // Envío de mensaje
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim() !== "") {
          const nuevoMsg = { chatId, remitenteUid: userId, texto: input.value.trim() };
          socket.emit("enviarMensaje", nuevoMsg);
          input.value = "";
        } else {
          socket.emit("usuarioEscribiendo", { chatId, remitenteUid: userId });
        }
      });
    },
    didClose: () => {
      if (listener) socket.off("nuevoMensaje", listener);
      if (typingListener) socket.off("usuarioEscribiendo", typingListener);
      if (chatsActivos[chatAbiertoId]) chatsActivos[chatAbiertoId].vistos = true;
      guardarChatsLocal();
      chatAbiertoId = null;
      actualizarNotificacion();
    },
  });
}

// Helpers
function agregarMensaje(chatBox, msg, userId) {
  const div = document.createElement("div");
  const clase = msg.remitenteUid === userId ? "mensaje mensaje-propio" : "mensaje mensaje-otro";
  div.className = clase;
  div.textContent = msg.texto;
  chatBox.appendChild(div);
}

function generarChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

let soundUnlocked = false;
function playSound() {
  if (!soundUnlocked) return;
  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
  audio.volume = 0.5;
  audio.play().catch(() => {});
}
["click", "touchstart"].forEach((evt) =>
  window.addEventListener(evt, () => (soundUnlocked = true), { once: true })
);

// Mensaje recibido global
socket.on("nuevoMensaje", (msg) => {
  if (!msg?.chatId || !msg?.texto) return;
  if (msg.remitenteUid === userId) return;
  if (chatAbiertoId && msg.chatId === chatAbiertoId) return;

  playSound();
  socket.emit("unirseChat", { chatId: msg.chatId });

  chatsActivos[msg.chatId] = chatsActivos[msg.chatId] || {
    nombre: "Beneficiario",
    mensajes: [],
    vistos: false,
  };
  chatsActivos[msg.chatId].mensajes.push(msg);
  chatsActivos[msg.chatId].vistos = false;
  guardarChatsLocal();
  actualizarNotificacion();

  Swal.fire({
    toast: true,
    position: "bottom-end",
    icon: "info",
    title: "Nuevo mensaje recibido",
    text: msg.texto,
    timer: 4000,
    showConfirmButton: false,
    didOpen: () => {
      const popup = Swal.getPopup();
      if (popup) {
        popup.style.cursor = "pointer";
        popup.addEventListener("click", () => {
          Swal.close();
          const remotoId = msg.chatId.replace(`${userId}_`, "").replace(`_${userId}`, "");
          const remotoNombre = chatsActivos[msg.chatId]?.nombre || "Beneficiario";
          abrirChat(remotoId, remotoNombre);
        });
      }
    },
  });
});

// Menú principal (ver chats)
document.addEventListener("DOMContentLoaded", () => {
  const verMensajes = document.getElementById("verMensajes");
  const notif = document.getElementById("notif");

  function actualizarNotificacionLocal() {
    if (!notif) return;
    const noVistos = Object.values(chatsActivos).filter((c) => !c.vistos).length;
    notif.textContent = noVistos > 0 ? noVistos : "";
    notif.style.display = noVistos > 0 ? "inline-block" : "none";
  }
  window.actualizarNotificacion = actualizarNotificacionLocal;

  if (verMensajes) {
    verMensajes.addEventListener("click", async (e) => {
      e.preventDefault();
      actualizarNotificacionLocal();

      try {
        // Traemos beneficiarios
        const res = await fetch("/api/verBeneficiarios/usuarios");
        const data = await res.json();
        const beneficiarios = data.data || [];

        // Dividir: con chat y sin chat
        const chatsActivosArray = Object.entries(chatsActivos).filter(
          ([_, chat]) => chat.mensajes.length > 0 || chat.ultimoMensaje
        );

        const idsChatsActivos = chatsActivosArray.map(([id]) => id);
        const beneficiariosDisponibles = beneficiarios.filter(
          (ben) => !idsChatsActivos.some((id) => id.includes(ben.id))
        );

        // Sección: CHATS ACTIVOS
        const listaActivos = chatsActivosArray
          .map(
            ([chatId, chat]) => `
            <div class="chat-item" data-id="${chatId}">
              <i class="fa-solid fa-user-circle"></i>
              <div>
                <strong>${chat.nombre}</strong><br>
                <small>${chat.mensajes.at(-1)?.texto || chat.ultimoMensaje || ""}</small>
              </div>
            </div>`
          )
          .join("");

        // Sección: BENEFICIARIOS DISPONIBLES
        const listaDisponibles = beneficiariosDisponibles
          .map(
            (ben) => `
            <div class="chat-item" data-id="${ben.id}">
              <i class="fa-solid fa-user-circle"></i>
              <div>
                <strong>${ben.nombre} ${ben.apellidoPaterno || ""} ${ben.apellidoMaterno || ""}</strong><br>
                <small>Sin mensajes aún</small>
              </div>
            </div>`
          )
          .join("");

        if (!listaActivos && !listaDisponibles) {
          Swal.fire("Sin mensajes", "Aún no tienes chats ni beneficiarios disponibles.", "info");
          return;
        }

        const htmlContenido = `
          ${listaActivos ? `
            <h3 class="chat-titulo-seccion">──── Chats activos ────</h3>
            <div class="lista-chats">${listaActivos}</div>` : ''}
          ${listaDisponibles ? `
            <h3 class="chat-titulo-seccion">──── Beneficiarios disponibles ────</h3>
            <div class="lista-chats">${listaDisponibles}</div>` : ''}
        `;

        Swal.fire({
          title: "Tus Conversaciones",
          html: htmlContenido,
          showConfirmButton: false,
          showCloseButton: true,
          didOpen: () => {
            document.querySelectorAll(".chat-item").forEach((item) => {
              item.addEventListener("click", () => {
                const chatId = item.dataset.id;
                const chat = chatsActivos[chatId];
                const remotoNombre =
                  chat?.nombre ||
                  item.querySelector("strong")?.textContent ||
                  "Beneficiario";
                Swal.close();
                setTimeout(
                  () =>
                    abrirChat(
                      chatId.replace(`${userId}_`, "").replace(`_${userId}`, ""),
                      remotoNombre
                    ),
                  200
                );
              });
            });
          },
        });
      } catch (err) {
        // console.error("Error al cargar beneficiarios:", err);
        Swal.fire("Error", "No se pudieron cargar los beneficiarios disponibles.", "error");
      }
    });
  }
});

// Actualizar badges
function actualizarNotificacion() {
  const badgeMensajes = document.getElementById("badgeMensajes");
  const badgeNotificaciones = document.getElementById("badgeNotificaciones");
  const notifGlobal = document.getElementById("notif");

  const noVistos = Object.values(chatsActivos).filter((c) => !c.vistos).length;
  if (badgeMensajes) {
    if (noVistos > 0) {
      badgeMensajes.textContent = noVistos;
      badgeMensajes.classList.add("visible", "blink");
      setTimeout(() => badgeMensajes.classList.remove("blink"), 2000);
    } else {
      badgeMensajes.classList.remove("visible");
    }
  }

  const historialNotif = JSON.parse(localStorage.getItem("historialNotif")) || [];
  const notifCount = historialNotif.filter((n) => !n.visto).length;

  const total = noVistos + notifCount;
  if (notifGlobal) {
    notifGlobal.textContent = total > 0 ? total : "";
    notifGlobal.style.display = total > 0 ? "inline-block" : "none";
  }

  if (badgeNotificaciones) {
    if (notifCount > 0) {
      badgeNotificaciones.textContent = notifCount;
      badgeNotificaciones.classList.add("visible");
    } else {
      badgeNotificaciones.classList.remove("visible");
    }
  }
}
