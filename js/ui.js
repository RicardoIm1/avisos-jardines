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

    const loginLink = document.getElementById('login-link');
    const cerrarSesion = document.getElementById('cerrar-sesion');

    if (usuario) {

      if (loginLink) {
        loginLink.textContent = usuario.nombre || 'Mi cuenta';
        loginLink.href = '/avisos-jardines/admin.html';
      }

      if (cerrarSesion) {
        cerrarSesion.style.display = 'inline-block';

        cerrarSesion.onclick = function (e) {
          e.preventDefault();
          if (API.cerrarSesion) API.cerrarSesion();
          window.location.href = '/avisos-jardines/login.html';
        };
      }

    } else {

      if (loginLink) {
        loginLink.textContent = 'Iniciar sesión';
        loginLink.href = '/avisos-jardines/login.html';
      }

      if (cerrarSesion) {
        cerrarSesion.style.display = 'none';
      }
    }
  }

};