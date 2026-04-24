// ==================== UI CORE ====================

const UI = {

  async cargarHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    try {
      const res = await fetch('/barrio/common/header.html?v=' + Date.now());
      if (!res.ok) throw new Error('Header no encontrado');

      const html = await res.text();
      container.innerHTML = html;

      // Forzar la ejecución del script del header
      // El header tiene su propia función actualizarBotones
      const ejecutarHeader = () => {
        if (typeof window._headerActualizarBotones === 'function') {
          console.log('UI: Ejecutando _headerActualizarBotones');
          window._headerActualizarBotones();
        }
        if (typeof window.actualizarHeaderSesion === 'function') {
          console.log('UI: Ejecutando actualizarHeaderSesion');
          window.actualizarHeaderSesion();
        }
      };

      // Ejecutar múltiples veces para asegurar
      setTimeout(ejecutarHeader, 50);
      setTimeout(ejecutarHeader, 150);
      setTimeout(ejecutarHeader, 300);

    } catch (error) {
      console.error('Error cargando header:', error);
    }
  },

  mostrarMensaje(mensaje, tipo = 'info') {
    const container = document.getElementById('mensaje-container');
    if (!container) return;

    const clase = tipo === 'error' ? 'mensaje-error' : (tipo === 'exito' ? 'mensaje-exito' : 'mensaje-info');
    container.innerHTML = `<div class="mensaje ${clase}">${mensaje}</div>`;
    
    setTimeout(() => {
      if (container.innerHTML.includes(mensaje)) {
        container.innerHTML = '';
      }
    }, 5000);
  },

  mostrarError(mensaje) {
    this.mostrarMensaje(mensaje, 'error');
  },

  mostrarExito(mensaje) {
    this.mostrarMensaje(mensaje, 'exito');
  },

  mostrarInfo(mensaje) {
    this.mostrarMensaje(mensaje, 'info');
  }
};

// Exponer funciones globales para compatibilidad
window.UI = UI;
window.mostrarError = (msg) => UI.mostrarError(msg);
window.mostrarExito = (msg) => UI.mostrarExito(msg);

// ========== ACTUALIZAR HEADER SEGÚN SESIÓN ==========
function actualizarHeaderPorSesion() {
  const usuarioStr = localStorage.getItem('usuario');
  const apiKey = localStorage.getItem('api_key');

  const loginLink = document.getElementById('login-link');
  const userArea = document.getElementById('user-area');
  const userNameSpan = document.getElementById('user-name');
  const cerrarBtn = document.getElementById('cerrar-sesion');

  if (!loginLink) {
    console.log('Header no cargado aún, reintentando...');
    setTimeout(actualizarHeaderPorSesion, 200);
    return;
  }

  if (usuarioStr && apiKey) {
    try {
      const usuario = JSON.parse(usuarioStr);
      if (loginLink) loginLink.style.display = 'none';
      if (userArea) userArea.style.display = 'flex';
      if (userNameSpan) {
        userNameSpan.textContent = `👋 ${usuario.nombre || usuario.email || 'Usuario'}`;
        userNameSpan.style.cursor = 'pointer';
        userNameSpan.onclick = () => {
          window.location.href = '/barrio/admin.html';
        };
      }

      if (cerrarBtn) {
        const nuevoCerrar = cerrarBtn.cloneNode(true);
        cerrarBtn.parentNode.replaceChild(nuevoCerrar, cerrarBtn);
        nuevoCerrar.addEventListener('click', function (e) {
          e.preventDefault();
          localStorage.removeItem('usuario');
          localStorage.removeItem('api_key');
          window.location.href = '/barrio/index.html';
        });
      }
      console.log('Header actualizado - Usuario logueado');
    } catch (e) {
      console.error('Error al actualizar header:', e);
    }
  } else {
    if (loginLink) loginLink.style.display = 'inline-flex';
    if (userArea) userArea.style.display = 'none';
    console.log('Header actualizado - Sin sesión');
  }
}

// Exportar para usar en otras páginas si es necesario
window.actualizarHeaderPorSesion = actualizarHeaderPorSesion;