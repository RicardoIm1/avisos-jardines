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

      // 🔥 Esperar a que el DOM procese el HTML
      requestAnimationFrame(() => {
        this.sincronizarAuth();
      });

    } catch (error) {
      console.error('Error cargando header:', error);
    }
  },

  sincronizarAuth() {
    const usuario = API.getUsuarioActual();
    const apiKey = localStorage.getItem('api_key');

    const loginLink = document.getElementById('login-link');
    const adminLink = document.getElementById('admin-link');
    const cerrarSesion = document.getElementById('cerrar-sesion');

    if (usuario && apiKey) {
      // Usuario logueado - ocultar login, mostrar cerrar sesión
      if (loginLink) loginLink.style.display = 'none';

      if (cerrarSesion) {
        cerrarSesion.style.display = 'inline-flex';
        cerrarSesion.onclick = function (e) {
          e.preventDefault();
          localStorage.removeItem('usuario');
          localStorage.removeItem('api_key');
          window.location.href = '/avisos-jardines/login.html';
        };
      }

      if (adminLink) {
        if (usuario.rol === 'admin') {
          adminLink.style.display = 'inline-flex';
          adminLink.onclick = function (e) {
            e.preventDefault();
            window.location.href = '/avisos-jardines/admin.html';
          };
        } else {
          adminLink.style.display = 'none';
        }
      }
    } else {
      // Usuario no logueado
      if (loginLink) loginLink.style.display = 'inline-flex';
      if (adminLink) adminLink.style.display = 'none';
      if (cerrarSesion) cerrarSesion.style.display = 'none';
    }
  }

};