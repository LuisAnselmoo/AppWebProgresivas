import { headerMenu } from "./header.js";
import "./app.js";
import "../../js/app.js";

window.addEventListener("DOMContentLoaded", () => {
    headerMenu();

    const form = document.getElementById("preguntaForm");
    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelar = document.getElementById("btnCancelar");
    const tituloForm = document.getElementById("tituloForm");
    const selectCorrecta = document.getElementById("correcta");
    const nivelesContainer = document.getElementById("nivelesContainer");
    let editId = null;
    let todasLasPreguntas = [];

    // Filtro de nivel
    const filtroContainer = document.createElement("div");
    filtroContainer.classList.add("filtro-nivel");
    filtroContainer.innerHTML = `
    <label for="filtroNivel" class="label-filtro">
      Filtrar por nivel:
    </label>
    <select id="filtroNivel">
      <option value="1" selected>Nivel 1</option>
      <option value="2">Nivel 2</option>
      <option value="3">Nivel 3</option>
      <option value="4">Nivel 4</option>
      <option value="5">Nivel 5</option>
    </select>
  `;
    nivelesContainer.before(filtroContainer);
    const filtroNivel = document.getElementById("filtroNivel");

    // Cargar preguntas y renderizar por nivel
    async function cargarPreguntas() {
        nivelesContainer.innerHTML = `<p class="loading">Cargando preguntas...</p>`;
        const res = await fetch("/api/admin/preguntas-juego");
        const data = await res.json();
        if (data.status !== "success") return;

        todasLasPreguntas = data.data || [];
        renderizarNivel(Number(filtroNivel.value));
    }

    // Renderizar nivel seleccionado
    function renderizarNivel(nivelSeleccionado) {
        const preguntas = todasLasPreguntas.filter(
            (p) => p.Nivel === nivelSeleccionado
        );

        if (!preguntas.length) {
            nivelesContainer.innerHTML = `<p class="loading">No hay preguntas registradas para el nivel ${nivelSeleccionado}.</p>`;
            return;
        }

        const cards = preguntas
            .map((p) => {
                const opciones = p.Opciones.map(
                    (op, i) =>
                        `<div class="opcion-item"><i class="fa-regular fa-circle"></i> ${i + 1
                        }. ${op}</div>`
                ).join("");

                return `
          <div class="pregunta-card">
            <p class="pregunta-texto">${p.Pregunta}</p>
            <div class="opciones-lista">${opciones}</div>
            <div class="opcion-correcta">${p.Opciones[p.Correcta]}</div>

            <div class="acciones-card">
              <button class="btn-editar" data-id="${p.id}">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
              <button class="btn-eliminar" data-id="${p.id}">
                <i class="fa-solid fa-trash"></i> Eliminar
              </button>
            </div>
          </div>`;
            })
            .join("");

        nivelesContainer.innerHTML = `
      <div class="niveles-card">
        <h3 class="nivel-titulo">
          <i class="fa-solid fa-layer-group"></i> Nivel ${nivelSeleccionado}
        </h3>
        <div class="slider-contenido centrado">
          ${cards}
        </div>
      </div>`;

        const slider = nivelesContainer.querySelector(".slider-contenido");
        slider.scrollTo({ left: 0, behavior: "smooth" });
    }

    // Evento del filtro
    filtroNivel.addEventListener("change", () => {
        renderizarNivel(Number(filtroNivel.value));
    });

    // Crear / Actualizar
    function actualizarSelectCorrecta() {
        const opciones = [0, 1, 2, 3].map(
            (i) => document.getElementById(`op${i}`).value.trim()
        );
        selectCorrecta.innerHTML =
            '<option value="">Selecciona la respuesta correcta</option>' +
            opciones
                .map((op, i) => (op ? `<option value="${i}">${i + 1}. ${op}</option>` : ""))
                .join("");
    }

    document
        .querySelectorAll(".opciones input")
        .forEach((input) => input.addEventListener("input", actualizarSelectCorrecta));

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const body = {
            Pregunta: document.getElementById("pregunta").value.trim(),
            Opciones: [0, 1, 2, 3].map((i) =>
                document.getElementById(`op${i}`).value.trim()
            ),
            Correcta: Number(document.getElementById("correcta").value),
            Nivel: Number(document.getElementById("nivel").value),
        };

        const method = editId ? "PATCH" : "POST";
        const url = editId
            ? `/api/admin/preguntas-juego/${editId}`
            : "/api/admin/preguntas-juego";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();

        if (data.status === "success") {
            Swal.fire("Éxito", data.message, "success");
            form.reset();
            editId = null;
            tituloForm.textContent = "Registrar Nueva Pregunta";
            btnGuardar.innerHTML = `<i class="fa-solid fa-save"></i> Guardar Pregunta`;
            actualizarSelectCorrecta();
            await cargarPreguntas();
        }
    });

    // Eliminar / Editar
    nivelesContainer.addEventListener("click", async (e) => {
        if (e.target.closest(".btn-eliminar")) {
            const id = e.target.closest(".btn-eliminar").dataset.id;
            const conf = await Swal.fire({
                title: "¿Eliminar?",
                text: "Esta acción no se puede deshacer.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
            });
            if (conf.isConfirmed) {
                await fetch(`/api/admin/preguntas-juego/${id}`, { method: "DELETE" });
                Swal.fire("Eliminada", "La pregunta fue eliminada.", "success");
                await cargarPreguntas();
            }
        }

        if (e.target.closest(".btn-editar")) {
            const id = e.target.closest(".btn-editar").dataset.id;
            const p = todasLasPreguntas.find((x) => x.id === id);
            if (!p) return;

            document.getElementById("pregunta").value = p.Pregunta;
            p.Opciones.forEach(
                (op, i) => (document.getElementById(`op${i}`).value = op)
            );
            actualizarSelectCorrecta();
            document.getElementById("correcta").value = p.Correcta;
            document.getElementById("nivel").value = p.Nivel;

            editId = id;
            tituloForm.textContent = "Editar Pregunta";
            btnGuardar.innerHTML = `<i class="fa-solid fa-pen"></i> Actualizar`;
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });

    // Cancelar
    btnCancelar.addEventListener("click", () => {
        form.reset();
        editId = null;
        tituloForm.textContent = "Registrar Nueva Pregunta";
        btnGuardar.innerHTML = `<i class="fa-solid fa-save"></i> Guardar Pregunta`;
        actualizarSelectCorrecta();
    });

    // Inicial
    cargarPreguntas();
});
