import { headerMenu } from "./header.js";
import "./app.js";
import "../../js/app.js";

window.addEventListener("DOMContentLoaded", async () => {
  headerMenu();

  const calendarContainer = document.getElementById("calendar");
  const main = document.querySelector("main");

  // Controles de navegación
  const navContainer = document.createElement("div");
  navContainer.classList.add("calendar-nav");
  navContainer.innerHTML = `
    <button id="prevMonth"><i class="fa-solid fa-chevron-left"></i></button>
    <h2 id="monthTitle"></h2>
    <button id="nextMonth"><i class="fa-solid fa-chevron-right"></i></button>
  `;
  main.insertBefore(navContainer, calendarContainer);

  let fechaActual = new Date();
  let año = fechaActual.getFullYear();
  let mes = fechaActual.getMonth();

  // Obtener todas las solicitudes
  const res = await fetch(`/api/admin/solicitudes/todas`);
  const data = await res.json();
  const { beneficiarios, donadores } = data.data;

  // Convertir UID → nombre rápido
  const mapaNombres = {};
  beneficiarios.forEach(b => (mapaNombres[b.id] = b.nombre || "Beneficiario"));
  donadores.forEach(d => (mapaNombres[d.id] = d.nombre || "Donador"));

  function normalizarFecha(fecha) {
    if (!fecha) return null;
    if (typeof fecha === "string") return fecha.split("T")[0];
    if (fecha instanceof Date) return fecha.toISOString().split("T")[0];
    if (fecha.seconds) return new Date(fecha.seconds * 1000).toISOString().split("T")[0];
    return null;
  }

  function renderizarCalendario(año, mes) {
    calendarContainer.innerHTML = "";

    const primerDiaMes = new Date(año, mes, 1);
    const ultimoDiaMes = new Date(año, mes + 1, 0);
    const diasMes = ultimoDiaMes.getDate();
    const primerDiaSemana = primerDiaMes.getDay();

    const nombreMes = primerDiaMes.toLocaleString("es-ES", { month: "long", year: "numeric" });
    document.getElementById("monthTitle").textContent =
      nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    // Cabecera
    ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].forEach((dia) => {
      const header = document.createElement("div");
      header.classList.add("dia-header");
      header.textContent = dia;
      calendarContainer.appendChild(header);
    });

    // Espacios vacíos
    for (let i = 0; i < (primerDiaSemana === 0 ? 6 : primerDiaSemana - 1); i++) {
      const empty = document.createElement("div");
      empty.classList.add("dia", "vacio");
      calendarContainer.appendChild(empty);
    }

    // Días del mes
    for (let d = 1; d <= diasMes; d++) {
      const fecha = new Date(año, mes, d);
      const fechaISO = fecha.toISOString().split("T")[0];
      const diaDiv = document.createElement("div");
      diaDiv.classList.add("dia");
      diaDiv.innerHTML = `<span>${d}</span>`;

      let eventos = [];

      // --- Buscar beneficiarios por fecha ---
      beneficiarios.forEach((b) => {
        const diaPref = normalizarFecha(b.diaPreferido);
        if (diaPref === fechaISO) eventos.push({ tipo: "beneficiario", ...b });
      });

      // --- Buscar donadores por fecha ---
      donadores.forEach((don) => {
        const diaReco = normalizarFecha(don.fechaRecoleccion);
        if (diaReco === fechaISO) eventos.push({ tipo: "donador", ...don });
      });

      // Combinar pares asignados (beneficiario y donador)
      const combinados = [];
      const usados = new Set();

      eventos.forEach((ev) => {
        if (usados.has(ev.id)) return;

        // si este evento tiene asignación cruzada
        const asignadoId = ev.donadorAsignado || ev.beneficiarioAsignado;
        if (asignadoId) {
          const pareja = eventos.find(
            (e) =>
              (e.id === asignadoId ||
                e.donadorAsignado === ev.id ||
                e.beneficiarioAsignado === ev.id)
          );

          if (pareja) {
            combinados.push({ tipo: "asignado", principal: ev, pareja });
            usados.add(ev.id);
            usados.add(pareja.id);
            return;
          }
        }

        // si no tiene pareja
        combinados.push(ev);
        usados.add(ev.id);
      });

      // Agregar iconos
      let iconosHTML = "";
      let asignadoFondo = false;

      combinados.forEach((ev) => {
        if (ev.tipo === "asignado") {
          asignadoFondo = true;
          iconosHTML += `<i class="fa-solid fa-cart-shopping" style="color:#ff7043" title="Asignación Donador ↔ Beneficiario"></i>`;
        } else {
          const estado = ev.estatusSolicitud || ev.estatusDonacion || "pendiente";
          let icon = "fa-circle";
          let color = "#9e9e9e";
          if (estado === "aprobado") {
            icon = ev.tipo === "donador" ? "fa-box" : "fa-hand-holding-heart";
            color = "#43a047";
          } else if (estado === "rechazado") {
            icon = "fa-times-circle";
            color = "#e53935";
          } else if (estado === "pendiente") {
            icon = "fa-hourglass-half";
            color = "#ffb300";
          } else if (estado === "entregada") {
            icon = "fa-check-circle";
            color = "#4caf50";
          }
          iconosHTML += `<i class="fa-solid ${icon}" style="color:${color}" title="${ev.tipo} - ${estado}"></i>`;
        }
      });

      if (iconosHTML) {
        diaDiv.innerHTML += `<div class="iconos-dia">${iconosHTML}</div>`;
        diaDiv.dataset.info = JSON.stringify(combinados);
      }

      if (asignadoFondo) diaDiv.style.background = "#fff5e6";

      calendarContainer.appendChild(diaDiv);
    }
  }

  // Modal de detalles
  const modal = document.createElement("div");
  modal.classList.add("modal-detalle");
  document.body.appendChild(modal);

  calendarContainer.addEventListener("click", (e) => {
    const dia = e.target.closest(".dia");
    if (!dia || !dia.dataset.info) return;

    const eventos = JSON.parse(dia.dataset.info);
    let contenido = "";

    eventos.forEach((ev) => {
      // Caso combinado (beneficiario + donador)
      if (ev.tipo === "asignado") {
        const b = ev.principal.tipo === "beneficiario" ? ev.principal : ev.pareja;
        const d = ev.principal.tipo === "donador" ? ev.principal : ev.pareja;

        const productos =
          d.productos?.length > 0
            ? `<ul>${d.productos
                .map(
                  (p) =>
                    `<li>${p.nombre} - ${p.cantidad || ""} ${p.unidad || ""}</li>`
                )
                .join("")}</ul>`
            : "<p>Sin productos registrados</p>";

        contenido += `
          <div class="detalle-card" data-tipo="asignacion" style="background:#fff7e6;border-left:6px solid #ff9800">
            <h3><i class="fa-solid fa-cart-shopping"></i> Asignación Donador ↔ Beneficiario</h3>
            <p><strong>Donador:</strong> ${d.nombre || "Sin nombre"}</p>
            <p><strong>Beneficiario:</strong> ${b.nombre || "Sin nombre"}</p>
            ${productos}
          </div>
        `;
      } else {
        const estado = ev.estatusSolicitud || ev.estatusDonacion || "pendiente";
        const productos =
          ev.productos?.length > 0
            ? `<ul>${ev.productos
                .map(
                  (p) =>
                    `<li>${p.nombre} - ${p.cantidad || ""} ${p.unidad || ""}</li>`
                )
                .join("")}</ul>`
            : "";
        const asignado =
          ev.donadorAsignado || ev.beneficiarioAsignado
            ? mapaNombres[ev.donadorAsignado || ev.beneficiarioAsignado]
            : null;

        contenido += `
          <div class="detalle-card" data-estado="${estado}" data-tipo="${ev.tipo}">
            <h3>${ev.tipo === "donador" ? "Donador" : "Beneficiario"}: ${
          ev.nombre || "Sin nombre"
        }</h3>
            <p><strong>Estatus:</strong> ${estado}</p>
            ${ev.modalidad ? `<p><strong>Modalidad:</strong> ${ev.modalidad}</p>` : ""}
            ${
              ev.fechaRecoleccion
                ? `<p><strong>Fecha:</strong> ${normalizarFecha(ev.fechaRecoleccion)}</p>`
                : ""
            }
            ${
              ev.diaPreferido
                ? `<p><strong>Día preferido:</strong> ${normalizarFecha(ev.diaPreferido)}</p>`
                : ""
            }
            ${
              asignado
                ? `<p><strong>Asignado ${
                    ev.tipo === "donador" ? "a" : "de"
                  }:</strong> ${asignado}</p>`
                : ""
            }
            ${productos}
          </div>
        `;
      }
    });

    modal.innerHTML = `
      <div class="modal-content">
        <span class="cerrar-modal">&times;</span>
        <h2>Detalles del día</h2>
        ${contenido}
      </div>
    `;
    modal.classList.add("activo");
  });

  // Cerrar modal
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("cerrar-modal")) {
      modal.classList.remove("activo");
    }
  });

  // Navegación
  document.getElementById("prevMonth").addEventListener("click", () => {
    mes--;
    if (mes < 0) { mes = 11; año--; }
    renderizarCalendario(año, mes);
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    mes++;
    if (mes > 11) { mes = 0; año++; }
    renderizarCalendario(año, mes);
  });

  renderizarCalendario(año, mes);
});
