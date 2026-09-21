'use client';

import React, { useRef, useState } from 'react';
import { Camera, Smartphone, Upload, Trash2, Eye, MapPin, Plus } from 'lucide-react';
import { ComplaintPhoto } from '@/types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
import { processImageFile } from '@/lib/imageUtils';

interface Props {
  photos: ComplaintPhoto[];
  onPhotosChange: (photos: ComplaintPhoto[]) => void;
  maxPhotos?: number;
  label?: string;
}

export const PhotoUploadCamera: React.FC<Props> = ({
  photos,
  onPhotosChange,
  maxPhotos = 6,
  label = 'Evidências Fotográficas'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [activeViewerPhoto, setActiveViewerPhoto] = useState<ComplaintPhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process files selected via native camera or gallery
  const handleFiles = async (files: FileList | null, defaultLocation: string = 'LINHA DE PRODUÇÃO') => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newPhotosList = [...photos];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (newPhotosList.length >= maxPhotos) break;

        // Process image to normalize aspect ratio and compress (max 1000px, 0.74 quality)
        const processedUrl = await processImageFile(file, 1000, 0.74);

        const newPhoto: ComplaintPhoto = {
          id: `photo-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          url: processedUrl,
          caption: file.name.replace(/\.[^/.]+$/, '') || `Foto da Amostra ${newPhotosList.length + 1}`,
          defectLocation: defaultLocation
        };

        newPhotosList.push(newPhoto);
      }

      onPhotosChange(newPhotosList);
    } catch (err) {
      console.error('Erro ao processar arquivo de foto:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle capture from interactive live camera modal
  const handleLiveCameraCapture = (dataUrl: string, defectLocation: string) => {
    if (photos.length >= maxPhotos) return;

    const newPhoto: ComplaintPhoto = {
      id: `photo-cam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: dataUrl,
      caption: `Captura ${defectLocation} - ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      defectLocation: defectLocation || 'LINHA DE PRODUÇÃO'
    };

    onPhotosChange([...photos, newPhoto]);
  };

  const handleRemovePhoto = (id: string) => {
    onPhotosChange(photos.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-3.5 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          handleFiles(e.target.files, 'GALERIA / INSPEÇÃO');
          e.target.value = '';
        }}
      />

      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          handleFiles(e.target.files, 'CÂMERA DO CELULAR');
          e.target.value = '';
        }}
      />

      {/* Label and Counter */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span>{label}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {photos.length}/{maxPhotos}
          </span>
        </label>

        <span className="text-[11px] text-slate-400">
          Enquadramento fiel e alta resolução
        </span>
      </div>

      {/* Capture Options Buttons */}
      {photos.length < maxPhotos && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* 1. Live Camera Modal (WYSIWYG Frame) */}
          <button
            type="button"
            onClick={() => setIsCameraModalOpen(true)}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 to-teal-500/15 hover:from-cyan-500/25 hover:to-teal-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
          >
            <Camera className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Câmera com Mira (App)</span>
          </button>

          {/* 2. Native Mobile Camera */}
          <button
            type="button"
            onClick={() => nativeCameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
            title="Abre a câmera do próprio celular ou tablet"
          >
            <Smartphone className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
            <span>Câmera do Celular</span>
          </button>

          {/* 3. Upload from Gallery / Computer */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
          >
            <Upload className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
            <span>Galeria / Arquivo</span>
          </button>
        </div>
      )}

      {/* Processing Loader Indicator */}
      {isProcessing && (
        <div className="p-3 text-center rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-cyan-300 font-medium animate-pulse flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Otimizando imagem para garantir enquadramento exato...</span>
        </div>
      )}

      {/* Thumbnails of Attached Photos */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {photos.map((p, idx) => (
            <div
              key={p.id || idx}
              className="relative group rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 aspect-[4/3] flex flex-col justify-between shadow-lg transition-all hover:border-cyan-500/40"
            >
              {/* Photo Image displayed with object-contain to PRESERVE 100% of the framing */}
              <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black/80 p-1">
                <img
                  src={p.url}
                  alt={p.caption}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Bottom Caption & Location Overlay */}
              <div className="p-2 bg-gradient-to-t from-black via-slate-950/90 to-transparent border-t border-slate-800/60 text-[10px] space-y-0.5">
                <div className="font-semibold text-slate-200 truncate" title={p.caption}>
                  {p.caption}
                </div>
                {p.defectLocation && (
                  <div className="flex items-center gap-1 text-cyan-400 font-medium truncate text-[9px]">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span>{p.defectLocation}</span>
                  </div>
                )}
              </div>

              {/* Top Quick Actions (Zoom / Delete) */}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 z-20">
                {/* Fullscreen View */}
                <button
                  type="button"
                  onClick={() => setActiveViewerPhoto(p)}
                  className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 shadow-md transition-all cursor-pointer"
                  title="Ampliar foto"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(p.id)}
                  className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white shadow-md transition-all cursor-pointer"
                  title="Remover foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs space-y-1">
          <p>Nenhuma foto anexada ainda.</p>
          <p className="text-[11px] text-slate-600">
            Tire foto ao vivo ou carregue da galeria para registrar as evidências de qualidade.
          </p>
        </div>
      )}

      {/* Live WYSIWYG Camera Modal */}
      {isCameraModalOpen && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={handleLiveCameraCapture}
          title="Captura de Evidência com Enquadramento Fiel"
        />
      )}

      {/* Fullscreen Photo Viewer Modal */}
      {activeViewerPhoto && (
        <PhotoViewerModal
          photo={activeViewerPhoto}
          title="Visualização da Evidência Fotográfica"
          onClose={() => setActiveViewerPhoto(null)}
        />
      )}
    </div>
  );
};
