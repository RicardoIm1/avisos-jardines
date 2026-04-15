// ==================== UTILIDADES ====================

function normalizarTelefono(input) {
  if (!input) return null;
  let num = String(input).replace(/\D/g, '');
  if (num.length === 10) return '521' + num;
  if (num.startsWith('52') && num.length === 12) return num;
  if (num.startsWith('521') && num.length === 13) return num;
  return null;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==================== ESTADO ====================

let paginaActual = 1;
let categoriaActual = 'todos';
let todosLosAvisos = [];
let totalPaginas = 1;
const AVISOS_POR_PAGINA = 6;

// ==================== INICIO ====================

document.addEventListener('DOMContentLoaded', function () {
  cargarAvisos();

  const filtros = document.querySelectorAll('.filtro');
  filtros.forEach(btn => {
    btn.addEventListener('click', function () {
      filtros.forEach(b => b.classList.remove('activo'));
      this.classList.add('activo');
      categoriaActual = this.dataset.categoria;
      paginaActual = 1;
      cargarAvisos();
    });
  });
});

// ==================== CARGA DE DATOS ====================

async function cargarAvisos() {
  const contenedor = document.getElementById('avisos-container');
  if (!contenedor) return;

  contenedor.innerHTML = '<div class="cargando">📰 Cargando avisos...</div>';

  try {
    const consulta = {};
    if (categoriaActual !== 'todos') {
      consulta.categoria = categoriaActual;
    }

    const resultado = await API.listar('AVISOS', consulta, {
      pagina: 1,
      limite: 100
    });

    if (resultado && resultado.datos) {
      todosLosAvisos = resultado.datos.filter(a => a.status === 'activo' || a.status === undefined);
      filtrarYAplicarPaginacion();
    } else {
      contenedor.innerHTML = '<div class="mensaje mensaje-info">📭 No hay avisos disponibles</div>';
    }

  } catch (error) {
    console.error('Error cargando avisos:', error);
    contenedor.innerHTML = '<div class="mensaje mensaje-error">❌ Error al cargar avisos: ' + error.message + '</div>';
  }
}

// ==================== FILTRO + PAGINACIÓN ====================

function filtrarYAplicarPaginacion() {
  let avisosFiltrados = todosLosAvisos;

  if (categoriaActual !== 'todos') {
    avisosFiltrados = todosLosAvisos.filter(a => a.categoria === categoriaActual);
  }

  const inicio = (paginaActual - 1) * AVISOS_POR_PAGINA;
  const avisosPaginados = avisosFiltrados.slice(inicio, inicio + AVISOS_POR_PAGINA);
  totalPaginas = Math.ceil(avisosFiltrados.length / AVISOS_POR_PAGINA);

  renderizarAvisos(avisosPaginados, paginaActual, totalPaginas);
}

// ==================== REGISTRO DE ESTADÍSTICAS ====================

async function registrarEstadistica(accion, id) {
  try {
    const apiKey = localStorage.getItem('api_key');
    const resultado = await API.peticion(accion, { id: id }, apiKey);
    console.log(`✅ ${accion} registrado para aviso ${id}`);
    return resultado;
  } catch (error) {
    console.warn(`No se pudo registrar ${accion}:`, error);
    return null;
  }
}

// ==================== RENDERIZADO DE AVISOS ====================

function renderizarAvisos(avisos, pagina, totalPaginas) {
  const container = document.getElementById('avisos-container');
  if (!container) return;

  if (!avisos || avisos.length === 0) {
    container.innerHTML = '<div class="cargando">📭 No hay avisos para mostrar</div>';
    renderizarPaginacion(pagina, totalPaginas);
    return;
  }

  let html = '';
  
  avisos.forEach(aviso => {
    const fecha = aviso.created_at 
      ? new Date(aviso.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Fecha no disponible';
    
    const esUrgente = aviso.destacado === 'TRUE' || aviso.categoria === 'urgente';
    const esPendiente = aviso.status === 'pendiente';
    
    // ========== ESTADÍSTICAS DEL AVISO ==========
    const vistas = aviso.vistas || 0;
    const clicksWhatsApp = aviso.clicks_whatsapp || 0;
    const intereses = aviso.intereses || 0;
    
    // Calcular interacciones totales
    const totalInteracciones = vistas + clicksWhatsApp + intereses;
    
    // ========== VALIDACIÓN SEGURA PARA CONTACTO ==========
    let numeroWhatsApp = '';
    let numeroTelefono = '';
    
    const contactoStr = aviso.contacto ? String(aviso.contacto) : '';
    
    if (contactoStr) {
      const numeros = contactoStr.match(/\d+/g);
      if (numeros && numeros.length > 0) {
        const telefonoLimpio = numeros.join('');
        if (telefonoLimpio.length >= 10) {
          numeroWhatsApp = telefonoLimpio;
          numeroTelefono = telefonoLimpio;
        }
      }
    }
    
    const whatsappText = `Hola, vi tu aviso "${aviso.titulo}" en la plataforma de la colonia. Me interesa más información.`;
    
    // Categoría legible
    const categoriaNombre = {
      'urgente': '⚠️ URGENTE',
      'eventos': '🎉 EVENTO',
      'servicios': '🔧 SERVICIO',
      'perdidos': '🔍 PERDIDO',
      'clasificados': '💰 CLASIFICADO'
    }[aviso.categoria] || aviso.categoria || '📢 AVISO';
    
    const categoriaColor = {
      'urgente': '#dc3545',
      'eventos': '#28a745',
      'servicios': '#17a2b8',
      'perdidos': '#ffc107',
      'clasificados': '#6c757d'
    }[aviso.categoria] || '#6c757d';
    
    html += `
      <div class="tarjeta aviso-card ${esUrgente ? 'urgente' : ''} ${esPendiente ? 'pendiente' : ''}" onclick="verAviso('${aviso.id}')">
        ${esPendiente ? '<div class="pendiente-badge">⏳ Pendiente</div>' : ''}
        <div class="categoria-badge" style="background: ${categoriaColor}; color: white;">
          ${categoriaNombre}
        </div>
        
        ${aviso.imagen_url ? `<img src="${aviso.imagen_url}" alt="${aviso.titulo}" class="aviso-imagen" loading="lazy">` : ''}
        
        <div style="padding: 1rem;">
          <h3 class="tarjeta-titulo">${escapeHTML(aviso.titulo || 'Sin título')}</h3>
          
          <div class="aviso-fecha">
            <span>📅</span> ${fecha}
          </div>
          
          <div class="aviso-contenido-preview">
            ${escapeHTML(aviso.contenido ? aviso.contenido.substring(0, 120) : 'Sin contenido')}${aviso.contenido && aviso.contenido.length > 120 ? '...' : ''}
          </div>
          
          <div class="aviso-footer">
            <span>📍 ${escapeHTML(aviso.ubicacion || 'Colonia Jardines')}</span>
          </div>
          
          <!-- ESTADÍSTICAS DEL AVISO -->
          <div style="display: flex; gap: 1rem; margin-top: 0.8rem; font-size: 0.7rem; color: var(--color-texto-claro); border-top: 1px solid var(--color-borde); padding-top: 0.6rem;">
            <span title="Veces que se ha visto este aviso">👁️ ${vistas}</span>
            <span title="Personas que contactaron por WhatsApp">💬 ${clicksWhatsApp}</span>
            <span title="Personas que marcaron 'Me interesa'">❤️ ${intereses}</span>
            ${totalInteracciones > 0 ? `<span title="Interacciones totales">📊 ${totalInteracciones}</span>` : ''}
          </div>
        </div>
        
        <!-- Botón "Me interesa" -->
        <button class="interes-btn" 
                onclick="event.stopPropagation(); registrarInteres('${aviso.id}', this)"
                title="Me interesa este aviso">
          ❤️
        </button>
        
        ${numeroWhatsApp ? `
          <a href="https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(whatsappText)}" 
             class="whatsapp-btn" 
             onclick="event.stopPropagation(); registrarClickWhatsApp('${aviso.id}'); abrirWhatsApp('${numeroWhatsApp}', '${whatsappText}', event)"
             title="Contactar por WhatsApp">
            💬
          </a>
        ` : ''}
      </div>
    `;
  });
  
  container.innerHTML = html;
  renderizarPaginacion(pagina, totalPaginas);
}

// ==================== PAGINACIÓN ====================

function renderizarPaginacion(paginaActual, totalPaginas) {
  const pagContainer = document.getElementById('paginacion');
  if (!pagContainer) return;
  
  if (totalPaginas <= 1) {
    pagContainer.innerHTML = '';
    return;
  }
  
  let html = '';
  
  if (paginaActual > 1) {
    html += `<button class="pagina" data-pagina="${paginaActual - 1}">« Anterior</button>`;
  }
  
  const inicio = Math.max(1, paginaActual - 2);
  const fin = Math.min(totalPaginas, paginaActual + 2);
  
  if (inicio > 1) {
    html += `<button class="pagina" data-pagina="1">1</button>`;
    if (inicio > 2) html += `<span class="paginacion-puntos">...</span>`;
  }
  
  for (let i = inicio; i <= fin; i++) {
    html += `<button class="pagina ${i === paginaActual ? 'activa' : ''}" data-pagina="${i}">${i}</button>`;
  }
  
  if (fin < totalPaginas) {
    if (fin < totalPaginas - 1) html += `<span class="paginacion-puntos">...</span>`;
    html += `<button class="pagina" data-pagina="${totalPaginas}">${totalPaginas}</button>`;
  }
  
  if (paginaActual < totalPaginas) {
    html += `<button class="pagina" data-pagina="${paginaActual + 1}">Siguiente »</button>`;
  }
  
  pagContainer.innerHTML = html;
  
  pagContainer.querySelectorAll('.pagina[data-pagina]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pagina = parseInt(btn.dataset.pagina);
      if (!isNaN(pagina)) {
        paginaActual = pagina;
        filtrarYAplicarPaginacion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// ==================== FUNCIONES GLOBALES ====================

window.verAviso = function(id) {
  window.location.href = `/avisos-jardines/aviso.html?id=${id}`;
};

window.registrarClickWhatsApp = async function(id) {
  await registrarEstadistica('REGISTRAR_CLICK_WHATSAPP', id);
};

window.registrarInteres = async function(id, btnElement) {
  const resultado = await registrarEstadistica('REGISTRAR_INTERES', id);
  if (resultado && resultado.success) {
    // Mostrar animación de confirmación
    if (btnElement) {
      btnElement.style.transform = 'scale(1.2)';
      setTimeout(() => {
        btnElement.style.transform = 'scale(1)';
      }, 300);
    }
    // Opcional: mostrar mensaje flotante
    const toast = document.createElement('div');
    toast.textContent = '❤️ ¡Gracias por tu interés!';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#1e4620';
    toast.style.color = 'white';
    toast.style.padding = '0.5rem 1rem';
    toast.style.borderRadius = '2rem';
    toast.style.zIndex = '1000';
    toast.style.fontSize = '0.8rem';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
};

window.abrirWhatsApp = function(numero, texto, event) {
  if (event) event.stopPropagation();
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
};

window.abrirTelefono = function(numero, event) {
  if (event) event.stopPropagation();
  window.open(`tel:${numero}`, '_blank');
};