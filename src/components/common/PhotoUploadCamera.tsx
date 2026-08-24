'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Image as ImageIcon, Video, X } from 'lucide-react';
import { ComplaintPhoto } from '@/types';

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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Helper to convert File to base64 DataURL
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      if (photos.length >= maxPhotos) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target?.result as string;
        if (!base64Url) return;

        const newPhoto: ComplaintPhoto = {
          id: `photo-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          url: base64Url,
          caption: file.name.replace(/\.[^/.]+$/, '') || 'Foto da amostra / desvio',
          defectLocation: 'FÁBRICA / INSPEÇÃO'
        };

        onPhotosChange([...photos, newPhoto]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    onPhotosChange(photos.filter(p => p.id !== id));
  };

  // Start live webcam for desktop / web browser
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setMediaStream(stream);
      setIsWebcamOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.warn('Webcam direct stream error, falling back to camera input:', err);
      // Fallback directly to native camera input
      cameraInputRef.current?.click();
    }
  };

  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsWebcamOpen(false);
  };

  const captureWebcamFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const newPhoto: ComplaintPhoto = {
      id: `photo-cam-${Date.now()}`,
      url: dataUrl,
      caption: `Captura Câmera Qualidade - ${new Date().toLocaleTimeString('pt-BR')}`,
      defectLocation: 'LINHA DE PRODUÇÃO'
    };

    onPhotosChange([...photos, newPhoto]);
    stopWebcam();
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
      
      {/* Label and counter */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span>{label} ({photos.length}/{maxPhotos})</span>
        </label>
        <span className="text-[11px] text-slate-400">Tire foto ou carregue arquivos</span>
      </div>

      {/* Action Buttons: Tire Foto / Carregar Arquivo */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Button: Tirar Foto (Câmera) */}
        <button
          type="button"
          onClick={startWebcam}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Camera className="w-4 h-4 text-cyan-400" />
          <span>Tirar Foto (Câmera)</span>
        </button>

        {/* Button: Carregar Foto (Upload) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Upload className="w-4 h-4 text-slate-300" />
          <span>Carregar Foto (Galeria / PC)</span>
        </button>
      </div>

      {/* Live Webcam Modal Capture if active */}
      {isWebcamOpen && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span className="font-bold flex items-center gap-1.5 text-cyan-400">
              <Video className="w-4 h-4" />
              Câmera Ativa - Posicione o desvio na lente
            </span>
            <button
              type="button"
              onClick={stopWebcam}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-56 flex items-center justify-center border border-slate-800">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={stopWebcam}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={captureWebcamFrame}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              <Camera className="w-4 h-4" />
              <span>Capturar Foto</span>
            </button>
          </div>
        </div>
      )}

      {/* Thumbnails of Attached Photos */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {photos.map((p, idx) => (
            <div
              key={p.id || idx}
              className="relative group rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex flex-col justify-end shadow-md"
            >
              <img src={p.url} alt={p.caption} className="absolute inset-0 w-full h-full object-cover" />
              
              {/* Gradient overlay with caption */}
              <div className="relative z-10 p-1.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-[10px] text-slate-200">
                <div className="font-semibold truncate">{p.caption || 'Foto anexada'}</div>
                <div className="text-[9px] text-cyan-400">{p.defectLocation || 'Amostra'}</div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemovePhoto(p.id)}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg cursor-pointer"
                title="Remover foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 text-center rounded-lg border border-dashed border-slate-800 text-slate-500 text-[11px]">
          Nenhuma foto anexada ainda. Clique acima para tirar uma foto ou fazer upload.
        </div>
      )}

    </div>
  );
};
