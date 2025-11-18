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
// console.log("Conectado al Gateway de chat");

const userData = JSON.parse(localStorage.getItem("userData")) || {};
const userId = userData.uid;
const userRol = userData.rol || "desconocido";
const userNombre = userData.nombre || "Usuario";

socket.emit("registrarUsuario", { uid: userId });

socket.on("connect", () => {
  // console.log(`${userRol.toUpperCase()}: Socket conectado con ID:`, socket.id);
});

let mensajesNuevos = 0;
let chatsActivos = {};
let chatAbiertoId = null;
let escribirTimer = null;

function guardarChatsLocal() {
  localStorage.setItem("chatsActivos", JSON.stringify(chatsActivos));
}

// Al conectar el socket
socket.on("connect", () => {
  // console.log(`${userRol.toUpperCase()}: Socket conectado con ID:`, socket.id);

  if (userId) {
    socket.emit("registrarUsuario", { uid: userId });
    // console.log("Usuario registrado en gateway:", userId);
  } else {
    // console.warn("No se pudo registrar usuario: userId indefinido");
  }
});

// Reintentar registrar en reconexiones
socket.io.on("reconnect", () => {
  if (userId) socket.emit("registrarUsuario", { uid: userId });
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const cacheChats = localStorage.getItem("chatsActivos");
    if (cacheChats) {
      chatsActivos = JSON.parse(cacheChats);
      // console.log("Chats cargados desde cache:", chatsActivos);
      actualizarNotificacion();
    }

    const res = await fetch(`/api/verDonadores/misChats/${userId}`);
    const chats = await res.json();
    // console.log("Estructura de chats:", chats);

    if (Array.isArray(chats)) {
      chats.forEach((chat) => {
        const id = chat.id;
        chatsActivos[id] = chatsActivos[id] || {};

        // Buscar el participante que no sea el usuario actual
        // let remoto = chat.participantes?.find((p) => p.uid !== userId);
        // console.log("Participante remoto encontrado:", remoto);
        // Si no hay datos, usar un fallback
        // const nombreRemoto = remoto?.nombre || "Usuario";
        const nombreRemoto = chat.nombreRemoto || chatsActivos[id].nombre || "Usuario";


        // chatsActivos[id].nombre = chat.nombre || chatsActivos[id].nombre || "Usuario";
        chatsActivos[id].nombre = nombreRemoto;
        chatsActivos[id].ultimoMensaje = chat.ultimoMensaje || chatsActivos[id].ultimoMensaje || "";
        chatsActivos[id].mensajes = chatsActivos[id].mensajes || [];
        chatsActivos[id].vistos = chatsActivos[id].vistos ?? true;
      });
      // console.log("Chats actualizados desde Firestore:", chats);
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
        vistos: true
      };

      socket.emit("unirseChat", { chatId });

      socket.once("historialMensajes", (data) => {
        if (data.chatId !== chatId) return;
        chatBox.innerHTML = "";
        data.mensajes.forEach((msg) => agregarMensaje(chatBox, msg, userId));
        chatBox.scrollTop = chatBox.scrollHeight;
      });

      //   listener = (msg) => {
      //     if (msg.chatId !== chatId) return;
      //     agregarMensaje(chatBox, msg, userId);
      //     playSound();
      //     chatsActivos[chatId].mensajes.push(msg);
      //     chatsActivos[chatId].vistos = true;
      //     guardarChatsLocal();
      //     chatBox.scrollTop = chatBox.scrollHeight;
      //     actualizarNotificacion();
      //   };
      //   socket.on("nuevoMensaje", listener);

      //   typingListener = (data) => {
      //     if (data.chatId !== chatId || data.remitenteUid === userId) return;
      //     typingIndicator.textContent = `${remotoNombre} está escribiendo...`;
      //     clearTimeout(escribirTimer);
      //     escribirTimer = setTimeout(() => (typingIndicator.textContent = ""), 2000);
      //   };
      //   socket.on("usuarioEscribiendo", typingListener);

      //   input.addEventListener("keydown", (e) => {
      //     if (e.key === "Enter" && input.value.trim() !== "") {
      //       const nuevoMsg = { chatId, remitenteUid: userId, texto: input.value.trim() };
      //       socket.emit("enviarMensaje", nuevoMsg);
      //       input.value = "";
      //     } else {
      //       socket.emit("usuarioEscribiendo", { chatId, remitenteUid: userId });
      //     }
      //   });
      // },
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

      // Indicador “escribiendo...”
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
  audio.play().catch(() => { });
}
["click", "touchstart"].forEach((evt) =>
  window.addEventListener(evt, () => (soundUnlocked = true), { once: true })
);

socket.on("nuevoMensaje", (msg) => {
  // if (msg.remitenteUid === userId) return;
  // if (msg.chatId === chatAbiertoId) return;
  if (!msg?.chatId || !msg?.texto) return;

  // No hacer nada si el mensaje es mío
  if (msg.remitenteUid === userId) return;
  // Si el chat está abierto, mostrarlo directo
  if (chatAbiertoId && msg.chatId === chatAbiertoId) {
    // El listener interno de abrirChat() se encargará de mostrarlo
    // console.log("Ignorado en global: ya hay listener local activo para", chatAbiertoId);
    return;
  }

  playSound();
  socket.emit("unirseChat", { chatId: msg.chatId });

  chatsActivos[msg.chatId] = chatsActivos[msg.chatId] || {
    nombre: "Usuario desconocido",
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
          const remotoNombre = chatsActivos[msg.chatId]?.nombre || "Usuario";
          abrirChat(remotoId, remotoNombre);
        });
      }
    },
  });

  const notif = document.getElementById("notif");
  if (notif) {
    notif.classList.add("blink");
    setTimeout(() => notif.classList.remove("blink"), 2500);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const notif = document.getElementById("notif");
  const verMensajes = document.getElementById("verMensajes");
  const perfilIcon = document.getElementById("perfilIcon");
  const dropdown = document.getElementById("perfilDropdown");

  function actualizarNotificacionLocal() {
    if (!notif) return;
    const noVistos = Object.values(chatsActivos).filter((c) => !c.vistos).length;
    notif.textContent = noVistos > 0 ? noVistos : "";
    notif.style.display = noVistos > 0 ? "inline-block" : "none";
  }
  window.actualizarNotificacion = actualizarNotificacionLocal;

  // if (verMensajes) {
  //   verMensajes.addEventListener("click", (e) => {
  //     e.preventDefault();
  //     actualizarNotificacionLocal();

  //     const lista = Object.entries(chatsActivos)
  //       .map(
  //         ([chatId, chat]) => `
  //         <div class="chat-item" data-id="${chatId}">
  //           <i class="fa-solid fa-user-circle"></i>
  //           <div>
  //             <strong>${chat.nombre}</strong><br>
  //             <!--<small>${chat.mensajes.at(-1)?.texto || chat.ultimoMensaje || "Sin mensajes aún"}</small>-->
  //           </div>
  //         </div>`
  //       )
  //       .join("");

  //     if (lista.length === 0) {
  //       Swal.fire("Sin mensajes", "Aún no tienes chats activos.", "info");
  //       return;
  //     }

  //     Swal.fire({
  //       title: "Tus Conversaciones",
  //       html: `<div class="lista-chats">${lista}</div>`,
  //       showConfirmButton: false,
  //       showCloseButton: true,
  //       didOpen: () => {
  //         document.querySelectorAll(".chat-item").forEach((item) => {
  //           item.addEventListener("click", () => {
  //             const chatId = item.dataset.id;
  //             const chat = chatsActivos[chatId];
  //             const remotoNombre = chat.nombre || "Usuario";
  //             Swal.close();
  //             setTimeout(() => {
  //               abrirChat(
  //                 chatId.replace(`${userId}_`, "").replace(`_${userId}`, ""),
  //                 remotoNombre
  //               );
  //             }, 200);
  //           });
  //         });
  //       },
  //     });
  //   });
  // }
  if (verMensajes) {
    verMensajes.addEventListener("click", async (e) => {
      e.preventDefault();
      actualizarNotificacionLocal();

      try {
        // Traemos todos los donadores del sistema
        const res = await fetch('/api/verDonadores/usuarios');
        const data = await res.json();
        const donadores = data.data || [];

        // Dividimos en: con chat y sin chat
        const chatsActivosArray = Object.entries(chatsActivos).filter(([_, chat]) =>
          chat.mensajes.length > 0 || chat.ultimoMensaje
        );

        const idsChatsActivos = chatsActivosArray.map(([id]) => id);
        const donadoresDisponibles = donadores.filter(
          (don) => !idsChatsActivos.some(id => id.includes(don.id))
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

        // Sección: DONADORES DISPONIBLES
        const listaDisponibles = donadoresDisponibles
          .map(
            (don) => `
          <div class="chat-item" data-id="${don.id}">
            <i class="fa-solid fa-user-circle"></i>
            <div>
              <strong>${don.nombreEmpresa || don.nombre}</strong><br>
              <small>Sin mensajes aún</small>
            </div>
          </div>`
          )
          .join("");

        // Si no hay ni uno, mostramos mensaje
        if (!listaActivos && !listaDisponibles) {
          Swal.fire("Sin mensajes", "Aún no tienes chats activos ni donadores disponibles.", "info");
          return;
        }

        // Renderizamos con títulos y divisores
        const htmlContenido = `
        ${listaActivos ? `
          <h3 class="chat-titulo-seccion">──── Chats activos ────</h3>
          <div class="lista-chats">${listaActivos}</div>` : ''}
        ${listaDisponibles ? `
          <h3 class="chat-titulo-seccion">──── Donadores disponibles ────</h3>
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
                const remotoNombre = chat?.nombre || item.querySelector("strong")?.textContent || "Usuario";
                Swal.close();
                setTimeout(() => abrirChat(chatId.replace(`${userId}_`, "").replace(`_${userId}`, ""), remotoNombre), 200);
              });
            });
          },
        });

      } catch (err) {
        // console.error("Error al cargar donadores:", err);
        Swal.fire("Error", "No se pudieron cargar los donadores disponibles.", "error");
      }
    });
  }


  if (perfilIcon && dropdown) {
    perfilIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });
    window.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !perfilIcon.contains(e.target)) {
        dropdown.classList.remove("show");
      }
    });
    dropdown.addEventListener("click", (e) => e.stopPropagation());
  }
});

function actualizarNotificacion() {
  const notif = document.getElementById("notif");
  if (!notif) return;
  const noVistos = Object.values(chatsActivos).filter((c) => !c.vistos).length;
  notif.textContent = noVistos > 0 ? noVistos : "";
  notif.style.display = noVistos > 0 ? "inline-block" : "none";
}