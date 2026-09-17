/**
 * Utilitários para processamento, redimensionamento e compressão de imagens no cliente.
 * Garante que imagens de celulares/tablets mantenham o enquadramento exato e não sobrecarreguem a memória.
 */

export async function processImageFile(file: File, maxDimension: number = 1600, quality: number = 0.86): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('Falha ao ler arquivo de imagem'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calcula proporções exatas respeitando o limite máximo
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Desenha a imagem preservando 100% o aspect ratio
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // Fallback para o dataUrl original se falhar o carregamento do objeto Image
        resolve(src);
      };

      img.src = src;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
