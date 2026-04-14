// ==================== API CLIENT SIMPLIFICADO ====================
const API = {
  baseUrl: 'https://script.google.com/macros/s/AKfycby_68N-wRMXs0nA9khuOKWn2PJWKHX08g8UL1EMaWkCx84XL8H28F2G-ePc0IM-5KcJ/exec',

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

  async peticion(accion, datos = {}) {
    const payload = {
      accion: accion,
      ...datos,
      api_key: this.apiKey
    };
    
    console.log('📤 Enviando:', accion, payload);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      // Con no-cors no podemos leer la respuesta directamente
      // Por ahora, asumimos éxito
      console.log('📥 Petición enviada:', accion);
      return { success: true };
      
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      const resultado = await this.peticion('LOGIN', { email, password });
      console.log('Login enviado');
      
      // Simular éxito para pruebas
      localStorage.setItem('usuario', JSON.stringify({
        id: '5',
        email: email,
        nombre: 'Administrador',
        rol: 'admin'
      }));
      localStorage.setItem('api_key', 'simulated_key_' + Date.now());
      
      return { success: true };
    } catch (error) {
      console.error('Error login:', error);
      throw error;
    }
  },

  async listar(coleccion) {
    return this.peticion('LISTAR', { coleccion });
  },

  async crear(coleccion, datos) {
    return this.peticion('CREAR', { coleccion, datos });
  },

  async actualizar(coleccion, id, datos) {
    return this.peticion('ACTUALIZAR', { coleccion, id, datos });
  },

  async eliminar(coleccion, id) {
    return this.peticion('ELIMINAR', { coleccion, id });
  },

  cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('api_key');
    window.location.href = '/avisos-jardines/login.html';
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
    console.log('✅ API lista (modo simplificado)');
    window.dispatchEvent(new CustomEvent('api-ready'));
  }, 0);
}