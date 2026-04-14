// ==================== API CLIENT CON JSONP ====================
const API = {
  baseUrl: 'https://script.google.com/macros/s/AKfycbzeN_KyMO_ttPK-4--VpvRtvVQU5MPSzWtCx48ZI7rzEm1vY8KqU6nGcF9wc2DM89t8/exec',

  get apiKey() {
    return localStorage.getItem('api_key');
  },

  set apiKey(valor) {
    if (valor) {
      localStorage.setItem('api_key', valor);
    } else {
      localStorage.removeItem('api_key');
    }
  },

  getUsuarioActual() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  // Petición usando JSONP
  peticionJSONP(accion, datos = {}) {
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);

      const payload = {
        accion: accion,
        ...datos,
        api_key: this.apiKey
      };

      console.log('📤 Enviando petición:', accion, payload);

      const url = this.baseUrl + '?callback=' + callbackName + '&jsonp=' + encodeURIComponent(JSON.stringify(payload));

      window[callbackName] = function (respuesta) {
        delete window[callbackName];
        if (document.body.contains(script)) document.body.removeChild(script);

        console.log('📥 Respuesta cruda:', respuesta);

        // La respuesta puede venir como { success: true, data: {...} }
        if (respuesta && respuesta.success === true) {
          resolve(respuesta.data || respuesta);
        } else if (respuesta && respuesta.success === false) {
          reject(new Error(respuesta.error || 'Error en la petición'));
        } else {
          resolve(respuesta);
        }
      };

      const script = document.createElement('script');
      script.src = url;
      script.onerror = () => {
        delete window[callbackName];
        if (document.body.contains(script)) document.body.removeChild(script);
        reject(new Error('Error de conexión con el servidor'));
      };
      document.body.appendChild(script);
    });
  },

  async peticion(accion, datos = {}) {
    try {
      const resultado = await this.peticionJSONP(accion, datos);
      return resultado;
    } catch (error) {
      console.error('Error en petición:', error);
      throw error;
    }
  },

  async listar(coleccion, consulta = {}, paginacion = {}) {
    try {
      const resultado = await this.peticionJSONP('LISTAR', {
        coleccion,
        consulta,
        paginacion
      });
      return resultado;
    } catch (error) {
      console.error('Error en listar:', error);
      this.mostrarError('Error al cargar datos: ' + error.message);
      throw error;
    }
  },

  async crear(coleccion, datos) {
    try {
      const resultado = await this.peticionJSONP('CREAR', {
        coleccion,
        datos
      });
      return resultado;
    } catch (error) {
      console.error('Error en crear:', error);
      this.mostrarError('Error al crear: ' + error.message);
      throw error;
    }
  },

  async actualizar(coleccion, id, datos) {
    try {
      console.log('🔄 Actualizando:', { coleccion, id, datos });

      const resultado = await this.peticionJSONP('ACTUALIZAR', {
        coleccion,
        id,
        datos
      });

      console.log('✅ Actualización exitosa:', resultado);
      return resultado;
    } catch (error) {
      console.error('❌ Error en actualizar:', error);
      this.mostrarError('Error al actualizar: ' + error.message);
      throw error;
    }
  },

  // En api.js, reemplaza el método eliminar con este:

  async eliminar(coleccion, id) {
    try {
      console.log('🗑️ Eliminar:', { coleccion, id });
      const resultado = await this.peticionJSONP('ELIMINAR', { coleccion, id });
      console.log('Resultado eliminar:', resultado);

      // Considerar cualquier respuesta como éxito si no hay error
      this.mostrarExito('✅ Elemento eliminado correctamente');
      return { success: true };
    } catch (error) {
      console.error('Error en eliminar:', error);
      this.mostrarError('Error al eliminar: ' + error.message);
      throw error;
    }
  },

  async login(email, password) {
    try {
      const resultado = await this.peticionJSONP('LOGIN', { email, password });
      console.log('Respuesta LOGIN completa:', resultado);

      // ✅ La respuesta viene en resultado.data
      const data = resultado?.data || resultado;

      if (data && data.api_key) {
        this.apiKey = data.api_key;
        localStorage.setItem('api_key', data.api_key);
      }

      if (data && data.usuario) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
      }

      // Guardar también para renovación
      if (email && password) {
        localStorage.setItem('last_email', email);
        localStorage.setItem('last_password', password);
      }

      // Disparar evento de cambio de login
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('login-status-changed'));
      }

      return { success: true, usuario: data?.usuario, api_key: data?.api_key };
    } catch (error) {
      console.error('Error en login:', error);
      this.mostrarError('Error en login: ' + error.message);
      throw error;
    }
  },

  cerrarSesion() {
    this.apiKey = null;
    localStorage.removeItem('usuario');
    localStorage.removeItem('api_key');
  },

  logout() {
    this.cerrarSesion();
  },

  mostrarError(mensaje) {
    const contenedor = document.getElementById('mensaje-container');
    if (contenedor) {
      contenedor.innerHTML = `<div class="mensaje mensaje-error">${mensaje}</div>`;
      setTimeout(() => {
        if (contenedor.innerHTML.includes(mensaje)) {
          contenedor.innerHTML = '';
        }
      }, 5000);
    } else {
      console.error(mensaje);
      alert(mensaje);
    }
  },

  mostrarExito(mensaje) {
    const contenedor = document.getElementById('mensaje-container');
    if (contenedor) {
      contenedor.innerHTML = `<div class="mensaje mensaje-exito">${mensaje}</div>`;
      setTimeout(() => {
        if (contenedor.innerHTML.includes(mensaje)) {
          contenedor.innerHTML = '';
        }
      }, 5000);
    } else {
      console.log(mensaje);
    }
  }
};

// Evento cuando API está lista
if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log('✅ API lista');
    window.dispatchEvent(new CustomEvent('api-ready'));
  }, 0);
}