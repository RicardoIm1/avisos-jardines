// ==================== UI CORE ====================

const UI = {

  async cargarHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    try {
      const res = await fetch('/avisos-jardines/common/header.html?v=' + Date.now());
      if (!res.ok) throw new Error('Header no encontrado');

      const html = await res.text();
      container.innerHTML = html;

      // Esperar a que el DOM se actualice
      setTimeout(() => {
        this.sincronizarAuth();
      }, 50);

    } catch (error) {
      console.error('Error cargando header:', error);
    }
  },

  sincronizarAuth() {
    const usuario = API.getUsuarioActual();
    const apiKey = localStorage.getItem('api_key');

    // Elementos nuevos
    const loginLink = document.getElementById('login-link');
    const userArea = document.getElementById('user-area');
    const userNameSpan = document.getElementById('user-name');
    const perfilLink = document.getElementById('perfil-link');
    const cerrarSesion = document.getElementById('cerrar-sesion');

    // Elementos antiguos (para compatibilidad)
    const adminLink = document.getElementById('admin-link');

    console.log('UI.sincronizarAuth - Usuario:', usuario);
    console.log('UI.sincronizarAuth - Elementos encontrados:', {
      loginLink: !!loginLink,
      userArea: !!userArea,
      cerrarSesion: !!cerrarSesion
    });

    if (usuario && apiKey) {
      // ========== USUARIO LOGUEADO ==========
      
      // Ocultar botón de login
      if (loginLink) loginLink.style.display = 'none';
      
      // Mostrar área de usuario
      if (userArea) userArea.style.display = 'flex';
      
      // Mostrar nombre del usuario
      if (userNameSpan) {
        const nombreMostrar = usuario.nombre || usuario.email || 'Usuario';
        userNameSpan.textContent = `👋 ${nombreMostrar}`;
      }
      
      // Configurar enlace a perfil
      if (perfilLink) {
        perfilLink.onclick = function(e) {
          e.preventDefault();
          window.location.href = '/avisos-jardines/perfil.html';
        };
      }
      
      // Configurar botón cerrar sesión
      if (cerrarSesion) {
        // Remover eventos anteriores clonando
        const nuevoCerrar = cerrarSesion.cloneNode(true);
        cerrarSesion.parentNode.replaceChild(nuevoCerrar, cerrarSesion);
        nuevoCerrar.addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.removeItem('usuario');
          localStorage.removeItem('api_key');
          window.location.href = '/avisos-jardines/index.html';
        });
      }
      
      // Admin link (por si existe en el header)
      if (adminLink) {
        if (usuario.rol === 'admin') {
          adminLink.style.display = 'inline-flex';
          adminLink.onclick = function(e) {
            e.preventDefault();
            window.location.href = '/avisos-jardines/admin.html';
          };
        } else {
          adminLink.style.display = 'none';
        }
      }
      
    } else {
      // ========== USUARIO NO LOGUEADO ==========
      
      if (loginLink) loginLink.style.display = 'inline-flex';
      if (userArea) userArea.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
    }
  },

  // Función para forzar actualización desde cualquier página
  actualizarHeader() {
    this.sincronizarAuth();
  }

};

// Exponer función global para que otros scripts puedan actualizar el header
window.actualizarHeaderSesion = function() {
  if (UI && UI.sincronizarAuth) {
    UI.sincronizarAuth();
  }
};