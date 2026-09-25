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
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldBeRecordingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check speech recognition support
  const isSpeechSupported = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const cleanupAudioLevel = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalStr += result[0].transcript + ' ';
          } else {
            interimStr += result[0].transcript;
          }
        }

        if (finalStr) {
          setTranscript(prev => {
            const combined = (prev + ' ' + finalStr).replace(/\s+/g, ' ').trim();
            return combined;
          });
        }
        setInterimTranscript(interimStr);
      };

      recognition.onerror = (event: any) => {
        // Silently ignore 'no-speech' or 'aborted', report other errors
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition error:', event.error);
        }
      };

      recognition.onend = () => {
        // If recording is still active and recognition stopped due to silence, restart it
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
    setInterimTranscript('');
    setDuration(0);
    audioChunksRef.current = [];
    shouldBeRecordingRef.current = true;

    try {
      // 1. Get audio stream with optimal quality for voice
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // 2. Set up AudioContext for real-time waveform / volume detection
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

      // 3. Determine supported MIME type for MediaRecorder
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

      recorder.start(250); // Slice chunks every 250ms

      // 4. Start speech recognition in pt-BR
      startRecognition();

      // 5. Start duration timer
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
  }, [startRecognition, cleanupStream]);

  const stopRecording = useCallback(async (): Promise<VoiceRecordingResult> => {
    shouldBeRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopRecognition();

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cleanupStream();
      setIsRecording(false);
      return {
        audioBlob: null,
        audioUrl: null,
        transcript: transcript.trim() || interimTranscript.trim(),
        duration
      };
    }

    return new Promise<VoiceRecordingResult>((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        cleanupStream();
        setIsRecording(false);

        const finalTranscript = (transcript + ' ' + interimTranscript).replace(/\s+/g, ' ').trim();

        resolve({
          audioBlob: blob,
          audioUrl: url,
          transcript: finalTranscript,
          duration: Math.max(duration, 1)
        });
      };

      try {
        recorder.stop();
      } catch {
        cleanupStream();
        setIsRecording(false);
        resolve({
          audioBlob: null,
          audioUrl: null,
          transcript: transcript.trim() || interimTranscript.trim(),
          duration
        });
      }
    });
  }, [stopRecognition, cleanupStream, transcript, interimTranscript, duration]);

  const cancelRecording = useCallback(() => {
    shouldBeRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopRecognition();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    cleanupStream();
    audioChunksRef.current = [];
    setIsRecording(false);
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setError(null);
  }, [stopRecognition, cleanupStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldBeRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecognition();
      cleanupStream();
    };
  }, [stopRecognition, cleanupStream]);

  const fullLiveTranscript = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).replace(/\s+/g, ' ').trim();

  return {
    isRecording,
    transcript: fullLiveTranscript,
    duration,
    audioLevel,
    error,
    isSpeechSupported,
    startRecording,
    stopRecording,
    cancelRecording
  };
}
