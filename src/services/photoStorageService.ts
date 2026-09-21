import { supabase } from '@/lib/supabase';

export interface PhotoUploadOptions {
  folder?: 'concessoes' | 'reclamacoes' | 'geral';
  prefix?: string;
  maxDimension?: number;
  quality?: number;
}

/**
 * Converte dataUrl base64 em Blob para upload binário eficiente
 */
function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return { blob: new Blob([u8arr], { type: mimeType }), mimeType };
}

export const photoStorageService = {
  /**
   * Faz upload de uma foto para o Supabase Storage (Bucket 'quality-evidence')
   * e retorna a URL pública leve e permanente.
   */
  async uploadPhoto(
    photoSource: string | File | Blob,
    options: PhotoUploadOptions = {}
  ): Promise<string> {
    const folder = options.folder || 'geral';
    const prefix = options.prefix ? options.prefix.replace(/[^a-zA-Z0-9_-]/g, '_') : 'foto';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    try {
      let uploadBlob: Blob;
      let contentType = 'image/jpeg';
      let extension = 'jpg';

      if (typeof photoSource === 'string') {
        if (photoSource.startsWith('http://') || photoSource.startsWith('https://')) {
          // Já é uma URL remota válida
          return photoSource;
        }

        if (photoSource.startsWith('data:')) {
          const { blob, mimeType } = dataUrlToBlob(photoSource);
          uploadBlob = blob;
          contentType = mimeType;
          if (mimeType.includes('webp')) extension = 'webp';
          else if (mimeType.includes('png')) extension = 'png';
        } else {
          return photoSource;
        }
      } else if (photoSource instanceof File) {
        uploadBlob = photoSource;
        contentType = photoSource.type || 'image/jpeg';
        if (contentType.includes('webp')) extension = 'webp';
        else if (contentType.includes('png')) extension = 'png';
      } else {
        uploadBlob = photoSource;
        contentType = photoSource.type || 'image/jpeg';
      }

      const fileName = `${prefix}_${Date.now()}_${randomSuffix}.${extension}`;
      const filePath = `${folder}/${year}/${month}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('quality-evidence')
        .upload(filePath, uploadBlob, {
          contentType,
          cacheControl: '31536000', // 1 ano de cache CDN
          upsert: false
        });

      if (error) {
        console.warn('Falha no upload para Supabase Storage, usando fallback:', error.message);
        // Fallback: se falhar o upload na nuvem, retorna a string original para não perder a foto
        return typeof photoSource === 'string' ? photoSource : '';
      }

      const { data: publicUrlData } = supabase.storage
        .from('quality-evidence')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Erro ao processar upload de foto:', err);
      return typeof photoSource === 'string' ? photoSource : '';
    }
  }
};
