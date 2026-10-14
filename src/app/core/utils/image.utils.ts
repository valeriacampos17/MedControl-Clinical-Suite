export interface CompressImageOptions {
  /** Lado mayor (px) al que se escala la imagen. Por defecto 256. */
  maxSize?: number;
  /** Calidad JPEG inicial (0-1). Por defecto 0.85. */
  quality?: number;
  /** Si se indica, baja la calidad hasta que el data URL no supere este largo. */
  maxBytes?: number;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Lee un archivo de imagen, lo reescala en un canvas y devuelve un data URL
 * JPEG. Es el mismo patron que usa la foto de perfil de los medicos, extraido
 * para reutilizarlo con la foto del paciente y las fotos de la consulta.
 */
export function fileToCompressedDataUrl(
  file: File,
  options: CompressImageOptions = {},
): Promise<string> {
  const { maxSize = 256, quality = 0.85, maxBytes } = options;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen valida'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (maxBytes) {
          let q = quality;
          while (dataUrl.length > maxBytes && q > 0.3) {
            q -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', q);
          }
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
