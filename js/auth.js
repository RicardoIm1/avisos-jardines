// ==================== AUTH ====================

const Auth = {

  // 🔐 Login
  async login(email, password) {
    try {
      const resultado = await API.login(email, password);

      console.log('Resultado login:', resultado);

      // 🔍 Validación realista
      if (!resultado) {
        throw new Error('Sin respuesta del servidor');
      }

      // ⚠️ Aquí depende de tu backend
      // Ajusta según lo que realmente regrese tu API
      if (resultado.error) {
        throw new Error(resultado.error);
      }

      // ✔️ Login válido
      return resultado;

    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // 🚪 Logout
  logout() {
    API.logout();
  },

  // 👤 Usuario actual
  getUsuario() {
    return API.getUsuarioActual();
  },

  // 🛡️ Protección de rutas
  requireAuth(redirect = '/avisos-jardines/login.html') {
    const usuario = this.getUsuario();

    if (!usuario) {
      window.location.href = redirect;
      return null;
    }

    return usuario;
  }

};