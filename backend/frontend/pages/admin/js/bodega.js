import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
import { headerMenu } from "./header.js";
import "./app.js";
import "../../js/app.js";

window.addEventListener("DOMContentLoaded", async () => {
  headerMenu();
  const contenedor = document.getElementById("bodegaContainer");

  async function cargarBodega() {
    const res = await fetch("/api/admin/asignaciones/bodega");
    const data = await res.json();
    const donaciones = data.data || [];

    if (donaciones.length === 0) {
      contenedor.innerHTML = "<p>No hay donaciones almacenadas en la bodega.</p>";
      return;
    }

    contenedor.innerHTML = donaciones
      .map(
        (d, i) => `
        <div class="card-bodega fade-up" style="animation-delay:${i * 0.1}s">
          <div class="card-header">
            <h3>${d.nombre || "Donador desconocido"}</h3>
            <span class="badge">En bodega</span>
          </div>
          <p><i class="fa-solid fa-calendar-day"></i> <strong>Recolectado:</strong> 
            ${d.fechaRecoleccion ? new Date(d.fechaRecoleccion).toLocaleDateString("es-MX") : "Sin fecha"}
          </p>
          <h4>Productos</h4>
          <ul>${(d.productos || [])
            .map(
              (p) => `<li><span>${p.nombre}</span> - <span>${p.cantidad} ${p.unidad || ""}</span></li>`
            )
            .join("")}</ul>
        </div>`
      )
      .join("");
  }

  await cargarBodega();

  // SOCKET.IO
  // const socket = io("http://localhost:3000", { transports: ["websocket"] });
  // chat.js o socket.js

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

  socket.on("connect", () => console.log("Bodega conectada en tiempo real"));
  socket.on("solicitudesActualizadas", ({ tipo }) => {
    if (tipo === "donadores") cargarBodega();
  });
});
