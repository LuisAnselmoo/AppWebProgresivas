import { abrirChat } from './chat.js';
import { headerMenu } from "./header.js";
import '../../js/app.js';
import './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  headerMenu();
  const contenedor = document.getElementById('beneficiariosContainer');
  const noBeneficiariosMsg = document.getElementById('noBeneficiariosMsg');

  try {
    const res = await fetch('/api/verBeneficiarios/usuarios');
    const data = await res.json();

    if (data.status === 'success' && data.data.length > 0) {
      data.data.forEach(beneficiario => {
        const card = document.createElement('div');
        card.classList.add('solicitud-card');

        card.innerHTML = `
          <div class="solicitud-header">
            <h3>${beneficiario.nombre || 'Beneficiario sin nombre'}</h3>
            <span class="estado">Beneficiario</span>
          </div>

          <div class="solicitud-body">
            <p><strong>Correo:</strong> ${beneficiario.correo}</p>
            <p><strong>Teléfono:</strong> ${beneficiario.telefono || 'No especificado'}</p>
            <p><strong>Estado:</strong> ${beneficiario.estado || 'N/A'}</p>
            <p><strong>Municipio:</strong> ${beneficiario.municipio || 'N/A'}</p>
            <p><strong>Descripción:</strong> ${beneficiario.descripcion || 'Sin descripción'}</p>
          </div>

          <div class="solicitud-footer">
            <button class="btn-verde btn-chat"
                    data-id="${beneficiario.id}"
                    data-nombre="${beneficiario.nombre}">
              Chat
            </button>
          </div>
        `;

        contenedor.appendChild(card);
      });

      document.querySelectorAll('.btn-chat').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const beneficiarioId = e.target.dataset.id;
          const beneficiarioNombre = e.target.dataset.nombre;
          abrirChat(beneficiarioId, beneficiarioNombre);
        });
      });
    } else {
      noBeneficiariosMsg.style.display = 'block';
    }
  } catch (error) {
    // console.error('Error al obtener beneficiarios:', error);
    Swal.fire('Error', 'No se pudieron cargar los beneficiarios', 'error');
  }
});
