// ==================== APLICACIÓN PRINCIPAL ====================

let paginaActual = 1;
let categoriaActual = 'todos';

document.addEventListener('DOMContentLoaded', function() {
  cargarAvisos();
  
  // Configurar filtros
  const filtros = document.querySelectorAll('.filtro');
  filtros.forEach(btn => {
    btn.addEventListener('click', function() {
      filtros.forEach(b => b.classList.remove('activo'));
      this.classList.add('activo');
      categoriaActual = this.dataset.categoria;
      paginaActual = 1;
      cargarAvisos();
    });
  });
});

async function cargarAvisos() {
  const contenedor = document.getElementById('avisos-container');
  if (!contenedor) return;
  
  contenedor.innerHTML = '<div class="cargando">Cargando avisos...</div>';
  
  try {
    const consulta = { status: 'activo' };
    if (categoriaActual !== 'todos') {
      consulta.categoria = categoriaActual;
    }
    
    console.log('Consultando avisos con filtro:', consulta);
    
    // Usar listar sin necesidad de autenticación
    const resultado = await API.listar('AVISOS', consulta, {
      pagina: paginaActual,
      limite: 12
    });
    
    if (!resultado || !resultado.datos || resultado.datos.length === 0) {
      contenedor.innerHTML = '<div class="mensaje mensaje-info">No hay avisos en esta categoría</div>';
    } else {
      contenedor.innerHTML = resultado.datos.map(aviso => crearTarjetaAviso(aviso)).join('');
    }
    
    if (resultado.paginacion) {
      renderizarPaginacion(resultado.paginacion);
    }
    
  } catch(error) {
    console.error('Error cargando avisos:', error);
    contenedor.innerHTML = '<div class="mensaje mensaje-error">Error al cargar avisos. Verifica tu conexión.</div>';
  }
}

function crearTarjetaAviso(aviso) {
  const fecha = aviso.created_at 
    ? new Date(aviso.created_at).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Fecha no disponible';
  
  const claseUrgente = aviso.categoria === 'urgente' ? 'urgente' : '';
  const titulo = aviso.titulo || 'Sin título';
  const contenido = aviso.contenido || '';
  
  const nombresCategoria = {
    'urgente': 'Urgente',
    'eventos': 'Eventos',
    'servicios': 'Servicios',
    'perdidos': 'Perdidos',
    'clasificados': 'Clasificados'
  };
  
  const categoriaNombre = nombresCategoria[aviso.categoria] || aviso.categoria || 'General';
  
  return `
    <div class="tarjeta ${claseUrgente}">
      <div class="tarjeta-titulo">${escapeHTML(titulo)}</div>
      <div class="tarjeta-fecha">${fecha}</div>
      <div class="tarjeta-contenido">${escapeHTML(contenido.substring(0, 150))}${contenido.length > 150 ? '...' : ''}</div>
      <div class="tarjeta-meta">
        <span>${categoriaNombre}</span>
        ${aviso.ubicacion ? `<span>📍 ${escapeHTML(aviso.ubicacion)}</span>` : ''}
      </div>
      ${aviso.id ? `<a href="/avisos-jardines/aviso.html?id=${aviso.id}" class="boton boton-chico" style="margin-top: 16px;">Ver completo</a>` : ''}
    </div>
  `;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderizarPaginacion(paginacion) {
  const contenedor = document.getElementById('paginacion');
  if (!contenedor) return;
  
  if (!paginacion || paginacion.paginas <= 1) {
    contenedor.innerHTML = '';
    return;
  }
  
  let html = '';
  for (let i = 1; i <= paginacion.paginas; i++) {
    if (i === 1 || i === paginacion.paginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
      html += `<button class="pagina ${i === paginaActual ? 'activa' : ''}" data-pagina="${i}">${i}</button>`;
    } else if (i === paginaActual - 3 || i === paginaActual + 3) {
      html += `<span class="pagina" style="background: none;">...</span>`;
    }
  }
  
  contenedor.innerHTML = html;
  
  contenedor.querySelectorAll('.pagina[data-pagina]').forEach(btn => {
    btn.addEventListener('click', function() {
      paginaActual = parseInt(this.dataset.pagina);
      cargarAvisos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}