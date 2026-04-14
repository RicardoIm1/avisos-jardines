// ==================== MULTIMEDIA MANAGER ====================
class MultimediaManager {
  constructor(api) {
    this.api = api;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }
  
  // Subir archivo desde input file
  async subirArchivo(avisoId, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result.split(',')[1];
          
          const resultado = await this.api.peticion('SUBIR_MULTIMEDIA', {
            datos: {
              avisoId: avisoId,
              base64: base64,
              nombre: file.name,
              tipo: file.type
            }
          });
          
          if (resultado.success) {
            resolve(resultado);
          } else {
            reject(new Error(resultado.error));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }
  
  // Subir múltiples archivos
  async subirMultiplesArchivos(avisoId, files) {
    const resultados = [];
    for (const file of files) {
      try {
        const resultado = await this.subirArchivo(avisoId, file);
        resultados.push({ file: file.name, success: true, data: resultado });
      } catch (error) {
        resultados.push({ file: file.name, success: false, error: error.message });
      }
    }
    return resultados;
  }
  
  // Iniciar grabación (cámara/video)
  async iniciarGrabacion(videoElement, tipo = 'video') {
    try {
      const constraints = tipo === 'video' 
        ? { video: true, audio: true }
        : { audio: true };
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoElement && tipo === 'video') {
        videoElement.srcObject = this.mediaStream;
        videoElement.play();
      }
      
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.recordedChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(1000); // Grabar en chunks de 1 segundo
      return true;
      
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      throw new Error('No se pudo acceder a la cámara/micrófono');
    }
  }
  
  // Detener grabación y subir
  async detenerGrabacion(avisoId, tipo = 'video') {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No hay grabación activa'));
        return;
      }
      
      this.mediaRecorder.onstop = async () => {
        // Detener todas las pistas
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.recordedChunks.length === 0) {
          reject(new Error('No se grabó nada'));
          return;
        }
        
        // Crear blob
        const mimeType = tipo === 'video' ? 'video/webm' : 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        
        // Convertir a base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64 = e.target.result.split(',')[1];
            const nombreArchivo = `grabacion_${Date.now()}.${tipo === 'video' ? 'webm' : 'wav'}`;
            
            const resultado = await this.api.peticion('SUBIR_MULTIMEDIA', {
              datos: {
                avisoId: avisoId,
                base64: base64,
                nombre: nombreArchivo,
                tipo: mimeType
              }
            });
            
            resolve(resultado);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsDataURL(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  // Tomar foto desde cámara
  async tomarFoto(videoElement, avisoId) {
    if (!videoElement || !videoElement.videoWidth) {
      throw new Error('Cámara no disponible');
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        try {
          const base64 = await this.blobToBase64(blob);
          const resultado = await this.api.peticion('SUBIR_MULTIMEDIA', {
            datos: {
              avisoId: avisoId,
              base64: base64.split(',')[1],
              nombre: `foto_${Date.now()}.jpg`,
              tipo: 'image/jpeg'
            }
          });
          resolve(resultado);
        } catch (error) {
          reject(error);
        }
      }, 'image/jpeg', 0.8);
    });
  }
  
  // Helper: blob a base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  // Listar multimedia de un aviso
  async listarMultimedia(avisoId) {
    const resultado = await this.api.peticion('LISTAR_MULTIMEDIA', {
      datos: { avisoId: avisoId }
    });
    return resultado;
  }
  
  // Eliminar archivo multimedia
  async eliminarArchivo(fileId) {
    const resultado = await this.api.peticion('ELIMINAR_MULTIMEDIA', {
      datos: { fileId: fileId }
    });
    return resultado;
  }
}