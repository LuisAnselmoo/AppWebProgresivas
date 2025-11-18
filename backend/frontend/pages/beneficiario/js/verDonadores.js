import { abrirChat } from './chat.js';
import { headerMenu } from "./header.js";
import '../../js/app.js';
import './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  headerMenu();

  const contenedor = document.getElementById('solicitudesContainer');
  const noDonadoresMsg = document.getElementById('noSolicitudesMsg');

  try {
    const res = await fetch('/api/verDonadores/usuarios');
    const data = await res.json();

    if (data.status === 'success' && data.data.length > 0) {
      noDonadoresMsg.style.display = 'none';
      data.data.forEach(donador => {
        const card = document.createElement('div');
        card.classList.add('solicitud-card');

        card.innerHTML = `
          <div class="solicitud-header">
            <h3>${donador.nombreEmpresa || donador.nombre}</h3>
            <span class="estado donador">Donador</span>
          </div>

          <div class="solicitud-body">
            <p><strong>Correo:</strong> ${donador.correo}</p>
            <p><strong>Teléfono:</strong> ${donador.telefono || 'No especificado'}</p>
            <p><strong>Tipo de Donador:</strong> ${donador.tipoDonador || 'N/A'}</p>
            <p><strong>Nombre Representante:</strong> ${donador.nombreRepresentante || 'N/A'}</p>
            <p><strong>Empresa:</strong> ${donador.nombreEmpresa || 'Particular'}</p>
            <p><strong>Estado:</strong> ${donador.estado || 'N/A'}</p>
            <p><strong>Municipio:</strong> ${donador.municipio || 'N/A'}</p>
          </div>

          <div class="solicitud-footer">
            <button class="btn-verde btn-chat"
                    data-id="${donador.id}"
                    data-nombre="${donador.nombreEmpresa || donador.nombre}">
              Chat
            </button>
          </div>
        `;

        contenedor.appendChild(card);
      });

      document.querySelectorAll('.btn-chat').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const donadorId = e.target.dataset.id;
          const donadorNombre = e.target.dataset.nombre;
          abrirChat(donadorId, donadorNombre);
        });
      });

    } else {
      noDonadoresMsg.style.display = 'block';
    }
  } catch (error) {
    // console.error('Error al obtener donadores:', error);
    Swal.fire('Error', 'No se pudieron cargar los donadores', 'error');
  }
});
