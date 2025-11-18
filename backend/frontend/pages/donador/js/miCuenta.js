import { headerMenu } from "./header.js";
import '../../js/app.js';
import './app.js';

document.addEventListener("DOMContentLoaded", async () => {
  headerMenu();
  const form = document.getElementById("perfilForm");
  const btnEditar = document.getElementById("btnEditar");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnCancelar = document.getElementById("btnCancelar");
  const btnEliminar = document.getElementById("btnEliminar");
  const btnSync = document.getElementById("btnSync");

  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire("Error", "Tu sesión ha expirado. Inicia sesión nuevamente.", "error")
      .then(() => (window.location.href = "../login.html"));
    return;
  }

  let usuarioOriginal = {};

  document.querySelectorAll("#perfilForm input, #perfilForm textarea").forEach(el => el.disabled = true);

  try {
    const res = await fetch("/api/miCuenta", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    if (data.status === "success" && data.usuario) {
      const u = data.usuario;
      window.usuarioActual = u;
      usuarioOriginal = { ...u };

      for (const key in u) {
        const input = form.querySelector(`#${key}`);
        if (input) input.value = u[key] || "";
      }
    } else {
      Swal.fire("Error", data.message || "No se pudo cargar el perfil.", "error");
    }
  } catch (err) {
    // console.error("Error al obtener perfil:", err);
    Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
  }

  btnEditar.addEventListener("click", () => {
    document.querySelectorAll("#perfilForm input, #perfilForm textarea").forEach(el => {
      if (["correo"].includes(el.id)) return;
      el.disabled = false;
    });
    btnGuardar.disabled = false;
    btnCancelar.disabled = false;
    btnEditar.disabled = true;
  });

  btnCancelar.addEventListener("click", () => {
    for (const key in usuarioOriginal) {
      const input = form.querySelector(`#${key}`);
      if (input) input.value = usuarioOriginal[key] || "";
    }
    document.querySelectorAll("#perfilForm input, #perfilForm textarea").forEach(el => el.disabled = true);
    btnGuardar.disabled = true;
    btnCancelar.disabled = true;
    btnEditar.disabled = false;
  });

  btnGuardar.addEventListener("click", async () => {
    const body = {};
    document.querySelectorAll("#perfilForm input, #perfilForm textarea").forEach(el => {
      if (!el.disabled && el.value.trim() !== "") body[el.id] = el.value.trim();
    });

    try {
      const res = await fetch("/api/miCuenta", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.status === "success") {
        Swal.fire("Éxito", "Tu perfil se actualizó correctamente.", "success").then(() => {
          document.querySelectorAll("#perfilForm input, #perfilForm textarea").forEach(el => el.disabled = true);
          btnGuardar.disabled = true;
          btnCancelar.disabled = true;
          btnEditar.disabled = false;
        });
      } else {
        Swal.fire("Error", data.message || "No se pudo actualizar el perfil.", "error");
      }
    } catch (err) {
      // console.error("Error al actualizar:", err);
      Swal.fire("Error", "Error al conectar con el servidor.", "error");
    }
  });

  btnSync.addEventListener("click", async () => {
    let telefonoInput = document.getElementById("telefono").value.trim();

    if (!telefonoInput) {
      Swal.fire("Teléfono vacío", "Por favor, asegúrate de tener un número registrado.", "warning");
      return;
    }

    if (!telefonoInput.startsWith("+")) {
      if (telefonoInput.startsWith("52")) telefonoInput = `+${telefonoInput}`;
      else telefonoInput = `+52${telefonoInput}`;
    }

    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(telefonoInput)) {
      Swal.fire(
        "Formato inválido",
        "El número debe seguir el formato internacional E.164 (por ejemplo: +5215512345678).",
        "error"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirmar sincronización",
      html: `
        <p>¿Es correcto este número de teléfono?</p>
        <b style="font-size: 1.2rem; color: #4caf50;">${telefonoInput}</b>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, sincronizar",
      cancelButtonText: "No, corregir",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("/api/miCuenta/sync", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ telefono: telefonoInput }),
      });

      const data = await res.json();

      if (data.status === "success") {
        Swal.fire("Sincronizado", "Tu número fue vinculado correctamente a tu cuenta.", "success");
      } else {
        Swal.fire("Error", data.message || "No se pudo sincronizar el número.", "error");
      }
    } catch (error) {
      // console.error("Error en sincronización:", error);
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
  });

  btnEliminar.addEventListener("click", async () => {
    const confirm = await Swal.fire({
      title: "¿Seguro que deseas eliminar tu cuenta?",
      text: "Esta acción eliminará todos tus datos y no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    const { value: credenciales } = await Swal.fire({
      title: "Verificación de identidad",
      html: `
        <input type="email" id="correoVerificacion" class="swal2-input" placeholder="Correo">
        <input type="password" id="passwordVerificacion" class="swal2-input" placeholder="Contraseña">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const correo = document.getElementById("correoVerificacion").value.trim();
        const password = document.getElementById("passwordVerificacion").value.trim();
        if (!correo || !password) {
          Swal.showValidationMessage("Debes llenar ambos campos");
          return false;
        }
        return { correo, password };
      },
      confirmButtonText: "Verificar y eliminar",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#e53935",
    });

    if (!credenciales) return;

    try {
      const res = await fetch("/api/miCuenta", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(credenciales),
      });

      const data = await res.json();

      if (data.status === "success") {
        Swal.fire("Cuenta eliminada", "Tu cuenta fue eliminada correctamente.", "success").then(() => {
          localStorage.clear();
          window.location.href = "../login.html";
        });
      } else {
        Swal.fire("Error", data.message || "Credenciales incorrectas o error al eliminar.", "error");
      }
    } catch (err) {
      // console.error("Error al eliminar cuenta:", err);
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
  });

  const inputFoto = document.getElementById("inputFoto");
  const fotoPerfil = document.getElementById("fotoPerfil");

  if (inputFoto) {
    inputFoto.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (fotoPerfil) fotoPerfil.src = event.target.result;
      };
      reader.readAsDataURL(file);

      Swal.fire({
        title: "Foto actualizada",
        text: "Tu nueva imagen se ha cargado correctamente (no se ha guardado aún).",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    });
  }
});
