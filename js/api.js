const API = {
  // REEMPLAZA CON TU URL
  baseUrl: 'https://script.google.com/macros/s/AKfycbxNCWY2g5VkMNYXN8dmywt_ElACDM17Z-riMMU_ocm7oswRQGc76ErYhA-DlOmVTgk4/exec',
  
  async peticion(accion, coleccion = null, datos = {}, id = null, consulta = {}, paginacion = {}) {
    const payload = {
      accion: accion,
      coleccion: coleccion,
      datos: datos,
      id: id,
      consulta: consulta,
      paginacion: paginacion,
      api_key: localStorage.getItem('api_key')
    };
    
    try {
      const respuesta = await fetch(this.baseUrl, {
        method: 'POST',
        mode: 'no-cors',  // ← CLAVE: esto evita el preflight CORS
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Con no-cors, no podemos leer la respuesta directamente
      console.log('Petición enviada (modo no-cors)');
      return { success: true, datos: [] };
      
    } catch(error) {
      console.error('Error:', error);
      throw error;
    }
  },
  
  listar: function(coleccion, consulta = {}, paginacion = {}) {
    return this.peticion('LISTAR', coleccion, {}, null, consulta, paginacion);
  }
};
  