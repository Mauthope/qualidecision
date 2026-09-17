'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Zap,
  ZapOff,
  Check,
  RefreshCw,
  Tag,
  Crosshair
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, defectLocation: string) => void;
  title?: string;
}

const DEFECT_LOCATIONS = [
  'Costura / Fechamento',
  'Solda / Tarja',
  'Lâmina / Tecido',
  'Impressão / Logo',
  'Válvula / Alça',
  'Fundo / Base',
  'Geral / Lote Completo'
];

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Captura de Evidência Técnica'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>(DEFECT_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState<string>('');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Stop camera tracks cleanly
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
    setTorchAvailable(false);
  }, []);

  // Start camera stream with stable references and progressive constraints
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsStarting(true);
    setCameraError(null);

    // Stop previous stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador não suporta acesso à câmera nesta conexão.');
      }

      let stream: MediaStream;

      // Tentativa 1: Alta resolução ideal com modo de câmera especificado
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (err1) {
        console.warn('Tentativa ideal falhou, tentando fallback simples com facingMode:', err1);
        // Tentativa 2: facingMode básico
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode },
            audio: false
          });
        } catch (err2) {
          console.warn('Tentativa com facingMode falhou, tentando qualquer câmera de vídeo:', err2);
          // Tentativa 3: qualquer câmera disponível
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;

        video.onloadedmetadata = () => {
          video.play().catch(e => console.warn('Erro ao reproduzir stream de vídeo:', e));
        };
        video.play().catch(() => {});
      }

      // Detecta suporte a lanterna (torch)
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities() as any;
        setTorchAvailable(Boolean(capabilities && capabilities.torch));
      } else {
        setTorchAvailable(false);
      }
    } catch (err: any) {
      console.error('Falha ao iniciar câmera:', err);
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      if (!isHttps && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        setCameraError('O acesso à câmera ao vivo requer conexão segura HTTPS no dispositivo.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão da câmera não concedida. Permita o uso da câmera nas configurações do navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Nenhuma câmera encontrada neste dispositivo.');
      } else {
        setCameraError('Não foi possível iniciar a câmera ao vivo. Você também pode usar a opção "Câmera do Celular" para capturar diretamente.');
      }
    } finally {
      setIsStarting(false);
    }
  }, []);

  // Inicia ao abrir e para ao fechar (executa SOMENTE quando isOpen ou facingMode mudam)
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      stopTracks();
    }

    return () => {
      stopTracks();
    };
  }, [isOpen, facingMode, startCamera, stopTracks]);

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Toggle torch / flash
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Erro ao acionar lanterna:', e);
    }
  };

  // Exact WYSIWYG Frame Capture
  const handleCaptureFrame = () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    if (!vw || !vh || !cw || !ch) return;

    // Calculate exact visible crop matching object-cover in container
    const videoRatio = vw / vh;
    const containerRatio = cw / ch;

    let sx = 0;
    let sy = 0;
    let sWidth = vw;
    let sHeight = vh;

    if (containerRatio > videoRatio) {
      // Container is wider than video: cropped top & bottom
      sHeight = vw / containerRatio;
      sy = (vh - sHeight) / 2;
    } else {
      // Container is taller than video: cropped left & right
      sWidth = vh * containerRatio;
      sx = (vw - sWidth) / 2;
    }

    const canvas = document.createElement('canvas');
    // High-res standard: maximum dimension 1600px
    const maxDim = 1600;
    let targetW = Math.round(sWidth);
    let targetH = Math.round(sHeight);

    if (targetW > maxDim || targetH > maxDim) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * maxDim) / targetW);
        targetW = maxDim;
      } else {
        targetW = Math.round((targetW * maxDim) / targetH);
        targetH = maxDim;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the exact visible rectangle that the user saw
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    setCapturedImage(dataUrl);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Confirm photo
  const handleConfirm = () => {
    if (!capturedImage) return;
    const location = customLocation.trim() || selectedLocation;
    onCapture(capturedImage, location);
    stopTracks();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-between animate-in fade-in duration-200 select-none">
      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between p-3 sm:p-4 bg-black/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white font-heading truncate max-w-[200px] sm:max-w-md">
              {title}
            </h2>
            <p className="text-[10px] text-slate-400">
              {capturedImage ? 'Revise o enquadramento antes de salvar' : 'Enquadre o desvio dentro da mira'}
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Torch button (mobile) */}
          {torchAvailable && !capturedImage && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isTorchOn
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
              title="Lanterna / Flash"
            >
              {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          {/* Flip camera button */}
          {!capturedImage && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Alternar Câmera (Frente / Traseira)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              stopTracks();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
            title="Fechar Câmera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Area (Centered) */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-[#040711]">
        {/* Error message */}
        {cameraError && (
          <div className="p-6 max-w-sm text-center bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-200 text-xs space-y-3">
            <p>{cameraError}</p>
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Active Frame Container: Maintains 4:3 or screen-adapted ratio */}
        {!cameraError && (
          <div
            ref={containerRef}
            className="relative w-full max-w-2xl aspect-[3/4] sm:aspect-[4/3] max-h-[72vh] rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/50 flex items-center justify-center"
          >
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                capturedImage ? 'hidden' : 'block'
              }`}
            />

            {/* Frozen Captured Image Preview */}
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="w-full h-full object-cover animate-in fade-in duration-150"
              />
            )}

            {/* Rule-of-Thirds Grid & Target Reticle (Only when live) */}
            {!capturedImage && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                {/* Rule of thirds grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/10 opacity-40 pointer-events-none">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="" />
                </div>

                {/* Central Focus Target */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border border-cyan-400/50 flex items-center justify-center">
                    <Crosshair className="w-8 h-8 text-cyan-400/60 animate-pulse" />
                  </div>
                </div>

                {/* Framing Notice Badge */}
                <div className="relative z-10 self-center px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold tracking-wide shadow-lg">
                  O QUE VOCÊ VÊ AQUI É EXATAMENTE O QUE SERÁ SALVO
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Shutter & Confirmation Bar */}
      <div className="relative z-20 p-4 bg-black/90 backdrop-blur-md border-t border-slate-800 space-y-3">
        {/* If photo captured: show location tag selector & confirm buttons */}
        {capturedImage ? (
          <div className="max-w-xl mx-auto space-y-3 animate-in slide-in-from-bottom-3 duration-200">
            {/* Defect Location Quick Tags */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Onde está o defeito no produto?</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEFECT_LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setCustomLocation('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedLocation === loc && !customLocation
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Retake vs Confirm */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <span>Tirar Outra Foto</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/30 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Confirmar e Salvar</span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Shutter Button */
          <div className="flex items-center justify-center py-2">
            <button
              type="button"
              onClick={handleCaptureFrame}
              disabled={isStarting || Boolean(cameraError)}
              className="group relative w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-white/80 p-1 flex items-center justify-center shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              aria-label="Tirar Foto"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400 via-teal-400 to-emerald-400 group-hover:scale-95 group-active:scale-90 transition-transform shadow-inner flex items-center justify-center">
                <Camera className="w-7 h-7 text-slate-950" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
