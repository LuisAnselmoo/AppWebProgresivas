import { headerMenu } from "./header.js";
import '../../js/app.js';
import './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  headerMenu();
  // Obtener el uid del usuario desde el localStorage
  const uid = localStorage.getItem('uid');
  // console.log("uid:", uid);

  // Verificar que el uid exista
  if (!uid) {
    Swal.fire('Error', 'Usuario no autenticado', 'error');
    return;
  }

  // Cargar los datos del usuario
  try {
    const res = await fetch(`/api/solicitudAlimento/${uid}`);
    const data = await res.json();
    // console.log("Datos del usuario:", data);

    // Rellenar los campos del formulario con los datos obtenidos
    if (data.status === 'success') {
      const user = data.data;

      // Función para asignar valor a un campo si existe
      const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
      };

      // Asignar valores a los campos
      setValue('nombre', user.nombre);
      setValue('apellidoPaterno', user.apellidoPaterno);
      setValue('apellidoMaterno', user.apellidoMaterno);
      setValue('correo', user.correo);
      setValue('telefono', user.telefono);
      setValue('tipoBeneficiario', user.tipoBeneficiario);
      setValue('nombreBeneficiario', user.nombreBeneficiario);
      setValue('curpRfcBeneficiario', user.curpRfcBeneficiario);
      setValue('calle', user.calle);
      setValue('numExterior', user.numExterior);
      setValue('numInterior', user.numInterior);
      setValue('colonia', user.colonia);
      setValue('codigoPostal', user.codigoPostal);
      setValue('municipio', user.municipio);
      setValue('estado', user.estado);
      setValue('referencias', user.referencias);
    } else {
      Swal.fire('Error', 'No se pudo obtener información del usuario', 'error');
    }
  } catch (err) {
    // console.error(err);
    Swal.fire('Error', 'Error de conexión con el servidor', 'error');
  }

  // Escuchar el botón de envío
  const btnEnviar = document.getElementById('btnEnviar');

  // Manejo dinámico del campo "Otro alimento"
  const otroCheck = document.getElementById('otroCheck');
  // selector del contenedor de selección de alimentos
  const seleccionAlimentos = document.querySelector('.seleccionAlimentos');

  // Contenedor donde irán los campos de "otro alimento"
  const otroContainer = document.createElement('div');
  otroContainer.id = 'otrosContainer';
  otroContainer.style.display = 'none';
  otroContainer.style.marginTop = '10px';
  seleccionAlimentos.appendChild(otroContainer);

  // Escucha cuando se activa o desactiva "Otro"
  otroCheck.addEventListener('change', () => {
    if (otroCheck.checked) {
      otroContainer.style.display = 'block';
      agregarCampoOtro();
    } else {
      otroContainer.innerHTML = '';
      otroContainer.style.display = 'none';
    }
  });

  // Función para agregar un nuevo campo de "Otro aliamento"
  function agregarCampoOtro() {
    // Crear un nuevo div para el campo y los botones
    const div = document.createElement('div');
    div.classList.add('otro-item');
    div.style.display = 'flex';
    div.style.gap = '8px';
    div.style.marginBottom = '6px';

    // Crear el input y los botones
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Especifica otro alimento';
    input.classList.add('otroAlimentoInput');
    input.style.flex = '1';

    // Botones de agregar y eliminar
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.style.background = '#22c55e';
    addBtn.style.color = 'white';
    addBtn.style.border = 'none';
    addBtn.style.borderRadius = '6px';
    addBtn.style.padding = '0 10px';
    addBtn.style.cursor = 'pointer';

    // Botón de eliminar
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '−';
    removeBtn.style.background = '#ef4444';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '6px';
    removeBtn.style.padding = '0 10px';
    removeBtn.style.cursor = 'pointer';

    // Eventos de los botones
    addBtn.addEventListener('click', agregarCampoOtro);
    removeBtn.addEventListener('click', () => div.remove());

    // Agregar los elementos al div y luego al contenedor
    div.appendChild(input);
    div.appendChild(addBtn);
    div.appendChild(removeBtn);
    otroContainer.appendChild(div);
  }

  btnEnviar.addEventListener('click', async () => {
    try {

      let tipoAlimentos = Array.from(document.querySelectorAll('.seleccionAlimentos input[type="checkbox"]:checked'))
        .map(cb => cb.value);

      // Si se seleccionó “Otro”, agrega todos los inputs escritos
      if (otroCheck.checked) {
        const otros = Array.from(document.querySelectorAll('.otroAlimentoInput'))
          .map(input => input.value.trim())
          .filter(txt => txt !== '');
        tipoAlimentos = tipoAlimentos.filter(t => t !== 'Otro').concat(otros.map(o => `Otro: ${o}`));
      }

      // Construir el objeto de solicitud
      const solicitud = {
        uid,
        nombre: document.getElementById('nombre').value,
        apellidoPaterno: document.getElementById('apellidoPaterno').value,
        apellidoMaterno: document.getElementById('apellidoMaterno').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value,
        tipoBeneficiario: document.getElementById('tipoBeneficiario').value,
        nombreBeneficiario: document.getElementById('nombreBeneficiario').value,
        curpRfcBeneficiario: document.getElementById('curpRfcBeneficiario').value,
        calle: document.getElementById('calle').value,
        numExterior: document.getElementById('numExterior').value,
        numInterior: document.getElementById('numInterior').value,
        colonia: document.getElementById('colonia').value,
        codigoPostal: document.getElementById('codigoPostal').value,
        municipio: document.getElementById('municipio').value,
        estado: document.getElementById('estado').value,
        referencias: document.getElementById('referencias').value,
        tipoAlimentos,
        donadorAsignado: document.getElementById("donadorAsignado").value || null,
        cantidad: document.getElementById('cantidad').value,
        frecuencia: document.getElementById('frecuencia').value,
        urgencia: document.getElementById('urgencia').value,
        modalidad: document.getElementById('modalidad').value,
        diaPreferido: document.getElementById('diaPreferido').value,
        horaPreferida: document.getElementById('horaPreferida').value,
        comentarios: document.getElementById('comentarios').value,
        estatusSolicitud: 'pendiente'
      };

      // Validación básica antes de enviar
      if (tipoAlimentos.length === 0) {
        Swal.fire('Atención', 'Selecciona al menos un tipo de alimento', 'warning');
        return;
      }

      if (!solicitud.cantidad || !solicitud.frecuencia || !solicitud.urgencia) {
        Swal.fire('Atención', 'Completa todos los campos obligatorios', 'warning');
        return;
      }

      // console.log("Solicitud enviada:", solicitud);

      // Enviar al backend
      const response = await fetch('/api/solicitudAlimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solicitud)
      });

      // Analizar la respuesta
      const result = await response.json();
      // console.log("Respuesta completa del backend:", result);


      if (result.status === 'success') {
        Swal.fire('Éxito', 'Solicitud registrada correctamente', 'success');
        limpiarCamposSolicitud();
      } else {
        const msg = Array.isArray(result.message)
          ? result.message.join('<br>')
          : (result.message || 'No se pudo registrar la solicitud');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          html: msg
        });
      }


    } catch (error) {
      // console.error("Error al enviar solicitud:", error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  });
});

function limpiarCamposSolicitud() {
  // Limpia los checkboxes
  document.querySelectorAll('.seleccionAlimentos input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.getElementById('otroAlimento').value = '';
  document.getElementById('otroAlimento').style.display = 'none';

  // Limpia los campos de texto, selects y textarea del área de solicitud
  const ids = [
    'cantidad',
    'frecuencia',
    'urgencia',
    'modalidad',
    'diaPreferido',
    'horaPreferida',
    'comentarios'
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Limpia los campos "Otro"
  const otroContainer = document.getElementById('otrosContainer');
  if (otroContainer) {
    otroContainer.innerHTML = '';
    otroContainer.style.display = 'none';
  }
  document.getElementById('otroCheck').checked = false;

}

// Evitar seleccionar fechas pasadas
const diaInput = document.getElementById('diaPreferido');
const horaInput = document.getElementById('horaPreferida');

if (diaInput) {
  const hoy = new Date().toISOString().split('T')[0];
  diaInput.min = hoy;

  diaInput.addEventListener('change', () => {
    const fechaSeleccionada = new Date(diaInput.value);
    const ahora = new Date();

    // Si la fecha seleccionada es hoy, limitar la hora mínima
    if (fechaSeleccionada.toDateString() === ahora.toDateString()) {
      const horaActual = ahora.toTimeString().slice(0, 5);
      horaInput.min = horaActual;
    } else {
      horaInput.min = '00:00';
    }
  });
}

// Cargar lista de donadores disponibles
async function cargarDonadoresDisponibles() {
  try {
    const res = await fetch("/api/solicitudAlimento/donadores/ids");
    const data = await res.json();

    const select = document.getElementById("donadorAsignado");

    if (data.status === "success" && data.data.length > 0) {
      data.data.forEach((donador) => {
        const opt = document.createElement("option");
        opt.value = donador.id; // uid del donador
        opt.textContent = donador.nombre || donador.id; // muestra el nombre
        select.appendChild(opt);
      });

    } else {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No hay donadores disponibles";
      select.appendChild(opt);
    }

  } catch (error) {
    // console.error("Error al cargar donadores:", error);
  }
}

// Llamar a la función al cargar
await cargarDonadoresDisponibles();
