// ==================== ADMINISTRACIÓN ====================

let paginaAdmin = 1;
let avisosActuales = [];
let filtroCategoriaAdmin = 'todos';

document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin.js cargado correctamente');
  
  // Verificar sesión
  const usuario = API.getUsuarioActual();
  if (!usuario) {
    console.log('No hay sesión activa, redirigiendo a login');
    window.location.href = '/avisos-jardines/login.html';
    return;
  }
  
  console.log('Usuario logueado:', usuario);
  
  // Mostrar pestaña de usuarios solo si es admin
  if (usuario.rol === 'admin') {
    const tabUsuarios = document.getElementById('tab-usuarios-btn');
    if (tabUsuarios) {
      tabUsuarios.style.display = 'inline-block';
      console.log('Pestaña de usuarios visible');
    }
  }
  
  // Configurar tabs
  configurarTabs();
  
  // Configurar cierre de sesión
  const cerrarSesionBtn = document.getElementById('cerrar-sesion');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', function(e) {
      e.preventDefault();
      API.cerrarSesion();
      window.location.href = '/avisos-jardines/login.html';
    });
  }
  
  // Formulario nuevo aviso
  const formAviso = document.getElementById('form-aviso');
  if (formAviso) {
    formAviso.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const usuarioActual = API.getUsuarioActual();
      const datos = {
        titulo: document.getElementById('titulo').value,
        contenido: document.getElementById('contenido').value,
        categoria: document.getElementById('categoria').value,
        ubicacion: document.getElementById('ubicacion').value || '',
        contacto: document.getElementById('contacto').value || '',
        fecha_evento: document.getElementById('fecha_evento').value || '',
        destacado: document.getElementById('urgente').checked ? 'TRUE' : 'FALSE',
        status: 'activo',
        usuario_id: usuarioActual.id,
        usuario_nombre: usuarioActual.nombre
      };
      
      // Validar campos requeridos
      if (!datos.categoria || !datos.titulo || !datos.contenido) {
        API.mostrarError('Completa los campos obligatorios');
        return;
      }
      
      try {
        await API.crear('AVISOS', datos);
        API.mostrarExito('Aviso publicado correctamente');
        formAviso.reset();
        document.getElementById('urgente').checked = false;
        
        // Cambiar a pestaña de lista
        const listaTab = document.querySelector('[data-tab="lista"]');
        if (listaTab) listaTab.click();
        
      } catch(error) {
        API.mostrarError('Error al publicar: ' + error.message);
      }
    });
  }
  
  // Cancelar formulario
  const cancelar = document.getElementById('cancelar');
  if (cancelar) {
    cancelar.addEventListener('click', function() {
      const form = document.getElementById('form-aviso');
      if (form) form.reset();
      document.getElementById('urgente').checked = false;
    });
  }
  
  // Activar notificaciones
  const btnNotif = document.getElementById('activar-notificaciones');
  if (btnNotif) {
    btnNotif.addEventListener('click', activarNotificaciones);
  }
  
  // Formulario de nuevo usuario (solo admin)
  const formUsuario = document.getElementById('form-usuario');
  if (formUsuario) {
    formUsuario.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const datos = {
        email: document.getElementById('user-email').value,
        nombre: document.getElementById('user-nombre').value,
        rol: document.getElementById('user-rol').value,
        password: document.getElementById('user-password').value,
        categorias: document.getElementById('user-categorias').value || 'todas',
        activo: 'TRUE'
      };
      
      if (!datos.email || !datos.nombre || !datos.password) {
        API.mostrarError('Completa todos los campos');
        return;
      }
      
      try {
        await API.peticion('CREAR_USUARIO', datos);
        API.mostrarExito('Usuario creado correctamente');
        formUsuario.reset();
        cargarUsuarios();
      } catch(error) {
        API.mostrarError('Error al crear usuario: ' + error.message);
      }
    });
  }
  
  // Cargar contenido inicial
  cargarMisAvisos();
});

function configurarTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  
  tabs.forEach(btn => {
    btn.addEventListener('click', function() {
      // Cambiar clase activa en botones
      tabs.forEach(b => b.classList.remove('activo'));
      this.classList.add('activo');
      
      // Ocultar todas las tabs
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('activo');
      });
      
      // Mostrar la tab seleccionada
      const tabId = `tab-${this.dataset.tab}`;
      const tabSeleccionada = document.getElementById(tabId);
      if (tabSeleccionada) {
        tabSeleccionada.classList.add('activo');
        
        // Cargar contenido según la tab
        if (this.dataset.tab === 'lista') {
          cargarMisAvisos();
        } else if (this.dataset.tab === 'perfil') {
          cargarPerfil();
        } else if (this.dataset.tab === 'usuarios') {
          cargarUsuarios();
        }
      }
    });
  });
}

async function cargarMisAvisos() {
  const contenedor = document.getElementById('mis-avisos-container');
  if (!contenedor) return;
  
  contenedor.innerHTML = '<div class="cargando">Cargando avisos...</div>';
  
  try {
    // Agregar filtro de categorías si no existe
    if (!document.querySelector('.filtros-categorias')) {
      const filtrosHTML = `
        <div class="filtros filtros-categorias" style="margin-bottom: 20px; justify-content: flex-start; flex-wrap: wrap;">
          <button class="filtro ${filtroCategoriaAdmin === 'todos' ? 'activo' : ''}" data-filtro-cat="todos">📋 Todos</button>
          <button class="filtro ${filtroCategoriaAdmin === 'urgente' ? 'activo' : ''}" data-filtro-cat="urgente">⚠️ Urgentes</button>
          <button class="filtro ${filtroCategoriaAdmin === 'eventos' ? 'activo' : ''}" data-filtro-cat="eventos">🎉 Eventos</button>
          <button class="filtro ${filtroCategoriaAdmin === 'servicios' ? 'activo' : ''}" data-filtro-cat="servicios">🔧 Servicios</button>
          <button class="filtro ${filtroCategoriaAdmin === 'perdidos' ? 'activo' : ''}" data-filtro-cat="perdidos">🔍 Perdidos</button>
          <button class="filtro ${filtroCategoriaAdmin === 'clasificados' ? 'activo' : ''}" data-filtro-cat="clasificados">💰 Clasificados</button>
        </div>
      `;
      contenedor.insertAdjacentHTML('beforebegin', filtrosHTML);
      
      // Agregar event listeners a los filtros de categoría
      document.querySelectorAll('[data-filtro-cat]').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('[data-filtro-cat]').forEach(b => b.classList.remove('activo'));
          this.classList.add('activo');
          filtroCategoriaAdmin = this.dataset.filtroCat;
          paginaAdmin = 1;
          cargarMisAvisos();
        });
      });
    }
    
    // Construir consulta
    let consulta = { status: 'activo' };
    if (filtroCategoriaAdmin !== 'todos') {
      consulta.categoria = filtroCategoriaAdmin;
    }
    
    const resultado = await API.listar('AVISOS', consulta, {
      pagina: paginaAdmin,
      limite: 10
    });
    
    const avisos = resultado.datos || [];
    const paginacion = resultado.paginacion || { pagina: 1, paginas: 1, total: 0 };
    
    if (avisos.length === 0) {
      contenedor.innerHTML = '<div class="mensaje mensaje-info">📭 No hay avisos que coincidan con los filtros</div>';
      return;
    }
    
    let html = '';
    avisos.forEach(aviso => {
      const fecha = aviso.created_at 
        ? new Date(aviso.created_at).toLocaleDateString('es-MX')
        : 'Fecha no disponible';
      const contenidoPreview = aviso.contenido ? aviso.contenido.substring(0, 100) : '';
      const esUrgente = aviso.destacado === 'TRUE' || aviso.categoria === 'urgente';
      
      html += `
        <div class="tarjeta" style="${esUrgente ? 'border-left: 4px solid #dc3545; background: #fff5f5;' : ''}">
          <div class="tarjeta-titulo">${escapeHTML(aviso.titulo || 'Sin título')} ${esUrgente ? '⚠️' : ''}</div>
          <div class="tarjeta-fecha">📅 ${fecha}</div>
          <div class="tarjeta-contenido">${escapeHTML(contenidoPreview)}${aviso.contenido && aviso.contenido.length > 100 ? '...' : ''}</div>
          <div class="tarjeta-meta">
            <span class="categoria-badge">🏷️ ${aviso.categoria || 'general'}</span>
          </div>
          <div class="grupo-botones" style="margin-top: 16px;">
            <a href="/avisos-jardines/aviso.html?id=${aviso.id}" class="boton boton-chico" style="width: auto;">👁️ Ver</a>
            <button class="boton boton-chico boton-secundario" onclick="editarAviso('${aviso.id}')">✏️ Editar</button>
            <button class="boton boton-chico boton-secundario" onclick="eliminarAviso('${aviso.id}')">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    });
    
    contenedor.innerHTML = html;
    
    // Mostrar paginación
    if (paginacion.paginas > 1) {
      let pagHtml = '<div class="paginacion-botones" style="display: flex; justify-content: center; gap: 8px; margin-top: 20px;">';
      if (paginaAdmin > 1) {
        pagHtml += `<button class="pagina" data-pagina="${paginaAdmin - 1}" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">« Anterior</button>`;
      }
      for (let i = 1; i <= paginacion.paginas; i++) {
        if (i === 1 || i === paginacion.paginas || (i >= paginaAdmin - 2 && i <= paginaAdmin + 2)) {
          pagHtml += `<button class="pagina ${i === paginaAdmin ? 'activa' : ''}" data-pagina="${i}" style="padding: 8px 12px; border: 1px solid ${i === paginaAdmin ? '#007bff' : '#ddd'}; background: ${i === paginaAdmin ? '#007bff' : 'white'}; color: ${i === paginaAdmin ? 'white' : '#333'}; border-radius: 4px; cursor: pointer;">${i}</button>`;
        } else if (i === paginaAdmin - 3 || i === paginaAdmin + 3) {
          pagHtml += `<span style="padding: 8px 12px;">...</span>`;
        }
      }
      if (paginaAdmin < paginacion.paginas) {
        pagHtml += `<button class="pagina" data-pagina="${paginaAdmin + 1}" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Siguiente »</button>`;
      }
      pagHtml += '</div>';
      
      const pagContainer = document.getElementById('paginacion-admin');
      if (pagContainer) {
        pagContainer.innerHTML = pagHtml;
        pagContainer.querySelectorAll('.pagina[data-pagina]').forEach(btn => {
          btn.addEventListener('click', function() {
            paginaAdmin = parseInt(this.dataset.pagina);
            cargarMisAvisos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        });
      }
    }
    
  } catch(error) {
    console.error('Error cargando avisos:', error);
    contenedor.innerHTML = '<div class="mensaje mensaje-error">❌ Error al cargar avisos: ' + error.message + '</div>';
  }
}

function cargarPerfil() {
  const contenedor = document.getElementById('perfil-info');
  if (!contenedor) return;
  
  const usuario = API.getUsuarioActual();
  
  contenedor.innerHTML = `
    <div class="campo">
      <label>👤 Nombre</label>
      <div style="padding: 8px 0; background: #f5f5f5; border-radius: 4px;">${escapeHTML(usuario.nombre || '—')}</div>
    </div>
    <div class="campo">
      <label>📧 Correo electrónico</label>
      <div style="padding: 8px 0; background: #f5f5f5; border-radius: 4px;">${escapeHTML(usuario.email)}</div>
    </div>
    <div class="campo">
      <label>👔 Rol</label>
      <div style="padding: 8px 0; background: #f5f5f5; border-radius: 4px;">${escapeHTML(usuario.rol)}</div>
    </div>
    <div class="campo">
      <label>🏷️ Categorías permitidas</label>
      <div style="padding: 8px 0; background: #f5f5f5; border-radius: 4px;">${escapeHTML(usuario.categorias || 'todas')}</div>
    </div>
  `;
}

async function cargarUsuarios() {
  const contenedor = document.getElementById('lista-usuarios-container');
  if (!contenedor) return;
  
  contenedor.innerHTML = '<div class="cargando">Cargando usuarios...</div>';
  
  try {
    const resultado = await API.listar('USUARIOS', { activo: 'TRUE' });
    const usuarios = resultado.datos || [];
    
    if (usuarios.length === 0) {
      contenedor.innerHTML = '<div class="mensaje mensaje-info">👥 No hay usuarios registrados</div>';
      return;
    }
    
    let html = '<div style="margin-top: 16px;">';
    usuarios.forEach(user => {
      html += `
        <div class="tarjeta" style="margin-bottom: 12px;">
          <div><strong>${escapeHTML(user.nombre || 'Sin nombre')}</strong></div>
          <div>📧 ${escapeHTML(user.email)}</div>
          <div>👔 Rol: ${escapeHTML(user.rol)} | 🏷️ Categorías: ${escapeHTML(user.categorias || 'todas')}</div>
        </div>
      `;
    });
    html += '</div>';
    
    contenedor.innerHTML = html;
    
  } catch(error) {
    console.error('Error cargando usuarios:', error);
    contenedor.innerHTML = '<div class="mensaje mensaje-error">❌ Error al cargar usuarios</div>';
  }
}

async function editarAviso(id) {
  window.location.href = `/avisos-jardines/aviso.html?id=${id}&editar=true`;
}

async function eliminarAviso(id) {
  if (!confirm('¿Eliminar este aviso permanentemente?')) return;
  
  try {
    await API.eliminar('AVISOS', id);
    API.mostrarExito('✅ Aviso eliminado correctamente');
    cargarMisAvisos();
  } catch(error) {
    API.mostrarError('Error al eliminar: ' + error.message);
  }
}

async function activarNotificaciones() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      API.mostrarExito('🔔 Notificaciones activadas correctamente');
    } else {
      API.mostrarError('❌ No se pudieron activar las notificaciones');
    }
  } else {
    API.mostrarError('❌ Tu navegador no soporta notificaciones');
  }
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