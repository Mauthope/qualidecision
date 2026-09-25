'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceRecordingResult {
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string;
  duration: number;
}

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldBeRecordingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Refs for real-time transcription to prevent stale closure bugs
  const accumulatedFinalRef = useRef('');
  const fullTranscriptRef = useRef('');

  // Check speech recognition support
  const isSpeechSupported = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const isMobile = typeof navigator !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
     (navigator.maxTouchPoints && navigator.maxTouchPoints > 1));

  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const cleanupAudioLevel = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (waveTimerRef.current) {
      clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    cleanupAudioLevel();
  }, [cleanupAudioLevel]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const startRecognition = useCallback(() => {
    if (!isSpeechSupported) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      // On iOS Safari, continuous MUST be false or an InvalidModificationError is thrown.
      // On Chrome/Edge (Desktop & Android), continuous=true is much faster and eliminates pause delays!
      recognition.continuous = !isIOS;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let currentFinal = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            currentFinal += result[0].transcript + ' ';
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (currentFinal) {
          accumulatedFinalRef.current = (accumulatedFinalRef.current + ' ' + currentFinal).replace(/\s+/g, ' ').trim();
        }

        const fullText = (accumulatedFinalRef.current + ' ' + currentInterim).replace(/\s+/g, ' ').trim();
        fullTranscriptRef.current = fullText;
        setTranscript(fullText);
        setIsTranscribing(Boolean(currentInterim));

        // When user speaks, increase audio level indicator
        if (currentInterim || currentFinal) {
          setAudioLevel(Math.floor(45 + Math.random() * 45));
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Permissão de microfone negada. Autorize o microfone no navegador.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition error:', event.error);
        }
      };

      recognition.onend = () => {
        setIsTranscribing(false);
        // If recording is still active and recognition ended (e.g. pause in speech or continuous=false), restart seamlessly
        if (shouldBeRecordingRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e: any) {
      console.warn('Failed to start SpeechRecognition:', e);
    }
  }, [isSpeechSupported]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    setDuration(0);
    accumulatedFinalRef.current = '';
    fullTranscriptRef.current = '';
    audioChunksRef.current = [];
    shouldBeRecordingRef.current = true;

    // 1. On mobile devices with SpeechRecognition support:
    // DO NOT run getUserMedia at the same time! On Android and iOS, getUserMedia locks
    // the hardware audio stream, which causes SpeechRecognition to fail with audio-capture error.
    if (isMobile && isSpeechSupported) {
      try {
        startRecognition();

        // Simulate lively audio equalizer bars while recording
        waveTimerRef.current = setInterval(() => {
          if (!shouldBeRecordingRef.current) return;
          setAudioLevel(prev => {
            const delta = (Math.random() - 0.5) * 30;
            return Math.max(15, Math.min(85, Math.round(prev + delta)));
          });
        }, 150);

        const startTime = Date.now();
        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 500);

        setIsRecording(true);
        return;
      } catch (err: any) {
        console.warn('Mobile speech recognition failed, fallback to getUserMedia:', err);
      }
    }

    // 2. On Desktop or Mobile without SpeechRecognition: use getUserMedia + MediaRecorder
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // AudioContext frequency analyser for real volume
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (!shouldBeRecordingRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch (err) {
        console.warn('AudioContext visualization not available:', err);
      }

      // MediaRecorder for desktop playback
      let mimeType = '';
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac'
      ];
      for (const t of types) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(250);

      // Start SpeechRecognition on desktop (desktop audio drivers support multi-client capture)
      startRecognition();

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 500);

      setIsRecording(true);
    } catch (err: any) {
      shouldBeRecordingRef.current = false;
      cleanupStream();
      console.error('Error starting audio recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permissão de microfone negada. Autorize o microfone no seu navegador.');
      } else {
        setError('Não foi possível acessar o microfone.');
      }
    }
  }, [isMobile, isSpeechSupported, startRecognition, cleanupStream]);

  const stopRecording = useCallback(async (): Promise<VoiceRecordingResult> => {
    setIsFinishing(true);
    shouldBeRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveTimerRef.current) {
      clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }

    // 1. Drain pending audio from SpeechRecognition gracefully (up to 900ms)
    // This allows the recognition engine to finish acoustic decoding of words spoken right before clicking Send!
    const recognition = recognitionRef.current;
    if (recognition) {
      await new Promise<void>((resolve) => {
        let finished = false;
        const complete = () => {
          if (!finished) {
            finished = true;
            resolve();
          }
        };

        const timer = setTimeout(complete, 900);

        recognition.onend = () => {
          clearTimeout(timer);
          complete();
        };

        try {
          recognition.stop();
        } catch {
          clearTimeout(timer);
          complete();
        }
      });

      try {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
      } catch {}
      recognitionRef.current = null;
    }

    // 2. Stop MediaRecorder if running
    const recorder = mediaRecorderRef.current;
    let audioBlob: Blob | null = null;
    let audioUrl: string | null = null;

    if (recorder && recorder.state !== 'inactive') {
      const audioResult = await new Promise<{ blob: Blob | null; url: string | null }>((resolve) => {
        recorder.onstop = () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        };
        try {
          recorder.stop();
        } catch {
          resolve({ blob: null, url: null });
        }
      });
      audioBlob = audioResult.blob;
      audioUrl = audioResult.url;
    }

    cleanupStream();
    setIsRecording(false);
    setIsFinishing(false);
    setIsTranscribing(false);

    const finalTranscript = fullTranscriptRef.current.trim();
    return {
      audioBlob,
      audioUrl,
      transcript: finalTranscript,
      duration: Math.max(duration, 1)
    };
  }, [cleanupStream, duration]);

  const cancelRecording = useCallback(() => {
    shouldBeRecordingRef.current = false;
    setIsFinishing(false);
    setIsTranscribing(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveTimerRef.current) {
      clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }

    stopRecognition();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    cleanupStream();
    audioChunksRef.current = [];
    accumulatedFinalRef.current = '';
    fullTranscriptRef.current = '';
    setIsRecording(false);
    setTranscript('');
    setDuration(0);
    setError(null);
  }, [stopRecognition, cleanupStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldBeRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
      stopRecognition();
      cleanupStream();
    };
  }, [stopRecognition, cleanupStream]);

  return {
    isRecording,
    isFinishing,
    isTranscribing,
    transcript: transcript || fullTranscriptRef.current,
    duration,
    audioLevel,
    error,
    isSpeechSupported,
    startRecording,
    stopRecording,
    cancelRecording
  };
}
