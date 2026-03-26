// ==================== APLICACIÓN PRINCIPAL ====================

let paginaActual = 1;
let categoriaActual = 'todos';
let mensajeInfoTimeout = null;

// Datos de prueba para cuando la API no tenga datos
const DATOS_PRUEBA = {
  datos: [
    {
      id: 1,
      titulo: 'Bienvenidos al Avisos Jardines',
      contenido: 'Este es un aviso de ejemplo. Pronto aparecerán los avisos reales de tu colonia.',
      categoria: 'eventos',
      created_at: new Date().toISOString(),
      ubicacion: 'Colonia Jardines',
      status: 'activo'
    },
    {
      id: 2,
      titulo: 'Junta de Vecinos',
      contenido: 'Se invita a todos los vecinos a la junta mensual el próximo sábado en el salón comunitario.',
      categoria: 'eventos',
      created_at: new Date().toISOString(),
      ubicacion: 'Salón Comunitario',
      status: 'activo'
    },
    {
      id: 3,
      titulo: '⚠️ Corte de agua programado',
      contenido: 'El próximo martes habrá corte de agua por mantenimiento de 9am a 2pm.',
      categoria: 'urgente',
      created_at: new Date().toISOString(),
      ubicacion: 'Toda la colonia',
      status: 'activo'
    }
  ],
  paginacion: {
    pagina: 1,
    paginas: 1,
    total: 3
  }
};

document.addEventListener('DOMContentLoaded', async function() {
  // Limpiar mensaje de conexión anterior si existe
  if (mensajeInfoTimeout) clearTimeout(mensajeInfoTimeout);
  
  // Primero verificar conexión
  const conectado = await API.verificarConexion();
  if (!conectado) {
    const container = document.getElementById('mensaje-container');
    if (container) {
      container.innerHTML = `
        <div class="mensaje mensaje-info">
          🔄 Conectando con el servidor... Si el problema persiste, verifica tu conexión a internet.
        </div>
      `;
      mensajeInfoTimeout = setTimeout(() => {
        if (container.innerHTML && container.innerHTML.includes('Conectando')) {
          container.innerHTML = '';
        }
      }, 5000);
    }
  }
  
  // Luego cargar los avisos
  await cargarAvisos();
  
  // Configurar filtros
  document.querySelectorAll('.filtro').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filtro').forEach(b => b.classList.remove('activo'));
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
    
    let resultado;
    try {
      resultado = await API.listar('AVISOS', consulta, {
        pagina: paginaActual,
        limite: 12
      });
    } catch (apiError) {
      console.warn('Error al obtener datos de API, usando datos de prueba:', apiError);
      resultado = DATOS_PRUEBA;
    }
    
    // Filtrar por categoría si es necesario
    let avisosFiltrados = resultado.datos || [];
    if (categoriaActual !== 'todos') {
      avisosFiltrados = avisosFiltrados.filter(aviso => aviso.categoria === categoriaActual);
    }
    
    if (avisosFiltrados.length === 0) {
      contenedor.innerHTML = '<div class="mensaje mensaje-info">📭 No hay avisos en esta categoría</div>';
    } else {
      contenedor.innerHTML = avisosFiltrados.map(aviso => crearTarjetaAviso(aviso)).join('');
    }
    
    // Renderizar paginación (simple para datos de prueba)
    if (resultado.paginacion) {
      renderizarPaginacion({
        ...resultado.paginacion,
        paginas: Math.ceil(avisosFiltrados.length / 12) || 1
      });
    }
    
  } catch(error) {
    console.error('Error al cargar avisos:', error);
    // Mostrar datos de prueba como fallback
    const avisosFiltrados = DATOS_PRUEBA.datos.filter(aviso => 
      categoriaActual === 'todos' || aviso.categoria === categoriaActual
    );
    contenedor.innerHTML = avisosFiltrados.map(aviso => crearTarjetaAviso(aviso)).join('');
    if (avisosFiltrados.length === 0) {
      contenedor.innerHTML = '<div class="mensaje mensaje-info">📭 No hay avisos en esta categoría</div>';
    }
  }
}

function crearTarjetaAviso(aviso) {
  if (!aviso) return '';
  
  const fecha = aviso.created_at ? new Date(aviso.created_at).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : 'Fecha no disponible';
  
  const claseUrgente = aviso.categoria === 'urgente' ? 'urgente' : '';
  const titulo = aviso.titulo || 'Sin título';
  const contenido = aviso.contenido || '';
  const categoria = aviso.categoria || 'general';
  const ubicacion = aviso.ubicacion || '';
  const id = aviso.id || '';
  
  return `
    <div class="tarjeta ${claseUrgente}">
      <div class="tarjeta-titulo">${escapeHTML(titulo)}</div>
      <div class="tarjeta-fecha">${fecha}</div>
      <div class="tarjeta-contenido">${escapeHTML(contenido.substring(0, 150))}${contenido.length > 150 ? '...' : ''}</div>
      <div class="tarjeta-meta">
        <span>${escapeHTML(categoria)}</span>
        ${ubicacion ? `<span>📍 ${escapeHTML(ubicacion)}</span>` : ''}
      </div>
      ${id ? `<a href="aviso.html?id=${id}" class="boton boton-chico" style="margin-top: 16px;">Ver completo</a>` : ''}
    </div>
  `;
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

function renderizarPaginacion(paginacion) {
  const contenedor = document.getElementById('paginacion');
  if (!contenedor) return;
  
  if (!paginacion || paginacion.paginas <= 1) {
    contenedor.innerHTML = '';
    return;
  }
  
  let html = '';
  
  for (let i = 1; i <= paginacion.paginas; i++) {
    if (i === 1 || i === paginacion.paginas || 
        (i >= paginaActual - 2 && i <= paginaActual + 2)) {
      html += `<button class="pagina ${i === paginaActual ? 'activa' : ''}" data-pagina="${i}">${i}</button>`;
    } else if (i === paginaActual - 3 || i === paginaActual + 3) {
      html += `<span class="paginacion-puntos" style="padding: 8px 12px; background: none; cursor: default;">...</span>`;
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