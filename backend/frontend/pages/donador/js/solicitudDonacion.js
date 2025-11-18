import { headerMenu } from "./header.js";
import '../../js/app.js';
import './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  headerMenu();
  const uid = localStorage.getItem('uid');
  // console.log("UID Donador cargado:", uid);

  // Elementos del DOM
  const productosContainer = document.getElementById('productosContainer');
  const btnAgregar = document.getElementById('btnAgregarProducto');
  const btnEnviar = document.getElementById('btnEnviar');
  let productos = [];

  // Verificar que el uid exista
  if (!uid) {
    Swal.fire('Error', 'Usuario no autenticado. Inicia sesión nuevamente.', 'error');
    // console.error("No se encontró el UID en localStorage");
    return;
  }

  // Cargar los datos del donador
  try {
    const res = await fetch(`/api/solicitudDonacion/${uid}`);

    // Verificar respuesta HTTP
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} (${res.statusText})`);
    }

    // datos JSON
    const data = await res.json();

    // Rellenar los campos del formulario con los datos obtenidos
    if (data.status === 'success') {
      const user = data.data;
      const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
      };

      // Asignar valores a los campos
      const campos = [
        'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo', 'telefono',
        'nombreEmpresa', 'rfcEmpresa', 'nombreRepresentante', 'cargoRepresentante',
        'contactoAlterno', 'correoAlterno', 'calle', 'numExterior', 'numInterior',
        'colonia', 'codigoPostal', 'municipio', 'estado', 'referencias'
      ];

      // Asignar valores usando el array de campos
      campos.forEach(c => setValue(c, user[c]));
    } else {
      // console.warn("El backend respondió con error:", data);
      Swal.fire('Error', data.message || 'No se pudo obtener la información del donador', 'error');
    }
  } catch (err) {
    // console.error("rror al obtener los datos del donador:", err);
    Swal.fire('Error', 'No se pudo conectar con el servidor para cargar tus datos', 'error');
  }

  // función para crear una tarjeta de producto
  function crearCardProducto(producto, index) {
    // Crear el elemento card
    const card = document.createElement('div');
    // Asignar clases y contenido
    card.classList.add('producto-card');
    // contenido HTML de la tarjeta
    card.innerHTML = `
      <button class="btn-danger">X</button>
      <h4 class='title-producto'>${producto.nombre}</h4>
      <p><strong>Categoría:</strong> ${producto.categoria}</p>
      <p><strong>Cantidad:</strong> ${producto.cantidad} ${producto.unidad}</p>
      <p><strong>Perecedero:</strong> ${producto.perecedero ? 'Sí' : 'No'}</p>
      ${producto.fechaCaducidad ? `<p><strong>Caduca:</strong> ${producto.fechaCaducidad}</p>` : ''}
      ${producto.observaciones ? `<p><strong>Notas:</strong> ${producto.observaciones}</p>` : ''}
    `;
    // Agregar evento para eliminar el producto
    card.querySelector('.btn-danger').addEventListener('click', () => {
      productos.splice(index, 1);
      renderProductos();
    });
    // card creado
    return card;
  }

  // función para renderizar los productos en el contenedor
  function renderProductos() {
    productosContainer.innerHTML = '';
    productos.forEach((p, i) => productosContainer.appendChild(crearCardProducto(p, i)));
  }

  // Escuchar el botón de agregar producto
  btnAgregar.addEventListener('click', () => {
    const nombre = document.getElementById('nombreProducto').value.trim();
    const categoria = document.getElementById('categoriaProducto').value;
    const cantidad = Number(document.getElementById('cantidadProducto').value);
    const unidad = document.getElementById('unidadProducto').value;
    const perecedero = document.getElementById('perecederoProducto').value === 'true';
    const fechaCaducidad = document.getElementById('caducidadProducto').value;
    const observaciones = document.getElementById('observacionesProducto').value.trim();

    if (!nombre || !cantidad || cantidad <= 0) {
      Swal.fire('Atención', 'Completa el nombre y una cantidad válida del producto', 'warning');
      return;
    }

    const nuevoProducto = {
      nombre,
      categoria,
      cantidad,
      unidad,
      perecedero,
      fechaCaducidad: fechaCaducidad || null,
      observaciones: observaciones || null,
    };

    productos.push(nuevoProducto);
    // console.log("Producto agregado:", nuevoProducto);
    renderProductos();

    // limpiar inputs
    document.getElementById('nombreProducto').value = '';
    document.getElementById('cantidadProducto').value = '';
    document.getElementById('observacionesProducto').value = '';
  });

  // validar donación antes de enviar
  function validarDonacion(d) {
    const errores = [];

    if (!d.modalidad) errores.push("Selecciona la modalidad (Recolección o Entrega)");
    if (!d.nombre || !d.apellidoPaterno || !d.apellidoMaterno)
      errores.push("Los campos de nombre y apellidos son obligatorios");
    if (!/^[\d]{10,15}$/.test(d.telefono))
      errores.push("El teléfono debe contener entre 10 y 15 dígitos numéricos");
    if (!d.correo.includes('@'))
      errores.push("El correo no es válido");
    if (!Array.isArray(d.productos) || d.productos.length === 0)
      errores.push("Debes agregar al menos un producto");

    return errores;
  }

  // Cargar beneficiarios disponibles
  async function cargarBeneficiarios() {
    try {
      const res = await fetch('/api/solicitudDonacion/beneficiarios/ids');
      const data = await res.json();

      const select = document.getElementById('beneficiarioAsignado');
      select.innerHTML = '<option value="">Selecciona un beneficiario</option>';

      if (data.status === 'success' && data.data.length > 0) {
        data.data.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.id;
          opt.textContent = b.nombre;
          select.appendChild(opt);
        });
      } else {
        const opt = document.createElement('option');
        opt.textContent = 'No hay beneficiarios registrados';
        opt.disabled = true;
        select.appendChild(opt);
      }
    } catch (error) {
      // console.error('Error al cargar beneficiarios:', error);
    }
  }

  await cargarBeneficiarios();

  // enviar donación al backend
  btnEnviar.addEventListener('click', async () => {
    try {
      const donacion = {
        uid,
        nombre: document.getElementById('nombre').value,
        apellidoPaterno: document.getElementById('apellidoPaterno').value,
        apellidoMaterno: document.getElementById('apellidoMaterno').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value,
        nombreEmpresa: document.getElementById('nombreEmpresa').value,
        rfcEmpresa: document.getElementById('rfcEmpresa').value,
        nombreRepresentante: document.getElementById('nombreRepresentante').value,
        cargoRepresentante: document.getElementById('cargoRepresentante').value,
        contactoAlterno: document.getElementById('contactoAlterno').value,
        correoAlterno: document.getElementById('correoAlterno').value,

        productos,
        modalidad: document.getElementById('modalidad').value,
        fechaRecoleccion: document.getElementById('fechaRecoleccion').value,
        horaRecoleccion: document.getElementById('horaRecoleccion').value,
        beneficiarioAsignado: document.getElementById('beneficiarioAsignado').value || null,
        comentarios: document.getElementById('comentarios').value,
        calle: document.getElementById('calle').value,
        numExterior: document.getElementById('numExterior').value,
        numInterior: document.getElementById('numInterior').value,
        colonia: document.getElementById('colonia').value,
        codigoPostal: document.getElementById('codigoPostal').value,
        municipio: document.getElementById('municipio').value,
        estado: document.getElementById('estado').value,
        referencias: document.getElementById('referencias').value,
        estatusDonacion: 'pendiente',
      };

      // console.log("Intentando enviar donación:", donacion);

      // Validar antes de enviar
      const errores = validarDonacion(donacion);
      if (errores.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Revisa tu información',
          html: errores.join('<br>'),
        });
        return;
      }

      const response = await fetch('/api/solicitudDonacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donacion),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();
      // console.log("Respuesta del backend:", result);

      if (result.status === 'success') {
        Swal.fire('Éxito', 'Donación registrada correctamente', 'success');
        limpiarCamposDonacion();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error en el registro',
          html: result.message || 'No se pudo registrar la donación',
        });
      }
    } catch (error) {
      // console.error("Error al enviar donación:", error);
      Swal.fire('Error', `No se pudo conectar con el servidor:<br><code>${error.message}</code>`, 'error');
    }
  });

  function limpiarCamposDonacion() {
    productos = [];
    renderProductos();
    ['modalidad', 'fechaRecoleccion', 'horaRecoleccion', 'comentarios', 'referencias']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  }
});
