"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SoundKind = "click" | "start" | "steam" | "warning" | "complete";

interface EngineAudio {
  context: AudioContext;
  master: GainNode;
  engineGain: GainNode;
  engine: OscillatorNode;
  pulse: OscillatorNode;
  pulseGain: GainNode;
  transients: Set<AudioScheduledSourceNode>;
}

/** Sound is opt-in: an AudioContext is constructed only inside toggle(). */
export function useRevoAudio() {
  const [enabled, setEnabled] = useState(false);
  const [narrationStatus, setNarrationStatus] = useState("Aktifkan suara untuk mendengarkan narasi.");
  const enabledRef = useRef(false);
  const audioRef = useRef<EngineAudio | null>(null);
  const speedRef = useRef(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cancelSpeech = useCallback(() => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    }
  }, []);

  const setEngineSpeed = useCallback((value: number) => {
    const speed = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    speedRef.current = speed;
    const audio = audioRef.current;
    if (!audio || audio.context.state === "closed") return;
    const now = audio.context.currentTime;
    audio.engine.frequency.setTargetAtTime(38 + speed * 0.7, now, 0.2);
    audio.pulse.frequency.setTargetAtTime(1.2 + speed * 0.085, now, 0.2);
    audio.engineGain.gain.setTargetAtTime(speed > 0 ? 0.07 + speed * 0.001 : 0, now, 0.25);
    audio.pulseGain.gain.setTargetAtTime(speed > 0 ? 0.025 + speed * 0.0003 : 0, now, 0.25);
  }, []);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    if (!next) {
      cancelSpeech();
      setNarrationStatus("Suara dinonaktifkan. Transkrip tetap dapat dibaca.");
      const audio = audioRef.current;
      if (audio && audio.context.state !== "closed") {
        audio.master.gain.cancelScheduledValues(audio.context.currentTime);
        audio.master.gain.setTargetAtTime(0, audio.context.currentTime, 0.025);
      }
      return;
    }

    setNarrationStatus("Suara aktif. Pilih narasi untuk mendengarkan.");
    try {
      if (!audioRef.current) {
        const AudioConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioConstructor) {
          setNarrationStatus("Efek suara tidak tersedia di peramban ini. Transkrip tetap dapat dibaca.");
          return;
        }
        const context = new AudioConstructor();
        const master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        const engine = context.createOscillator();
        engine.type = "triangle";
        const engineGain = context.createGain();
        engineGain.gain.value = 0;
        engine.connect(engineGain).connect(master);
        const pulse = context.createOscillator();
        pulse.type = "sine";
        const pulseGain = context.createGain();
        pulseGain.gain.value = 0;
        pulse.connect(pulseGain).connect(engineGain.gain);
        engine.start();
        pulse.start();
        audioRef.current = { context, master, engineGain, engine, pulse, pulseGain, transients: new Set() };
      }
      const audio = audioRef.current;
      // resume() is invoked synchronously from the user's sound-toggle event.
      void audio.context.resume().catch(() => {
        setNarrationStatus("Peramban belum mengizinkan audio. Nonaktifkan lalu aktifkan suara untuk mencoba lagi.");
      });
      audio.master.gain.cancelScheduledValues(audio.context.currentTime);
      audio.master.gain.setTargetAtTime(0.3, audio.context.currentTime, 0.035);
      setEngineSpeed(speedRef.current);
    } catch {
      setNarrationStatus("Audio tidak tersedia. Kamu tetap dapat membaca semua penjelasan.");
    }
  }, [cancelSpeech, setEngineSpeed]);

  const play = useCallback((kind: SoundKind) => {
    const audio = audioRef.current;
    if (!enabledRef.current || !audio || audio.context.state !== "running") return;
    const { context, master, transients } = audio;
    const now = context.currentTime;

    const tone = (frequency: number, delay: number, duration: number, volume = 0.3, type: OscillatorType = "sine") => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(volume, now + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      oscillator.connect(gain).connect(master);
      transients.add(oscillator);
      oscillator.onended = () => { transients.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(now + delay);
      oscillator.stop(now + delay + duration + 0.02);
    };

    if (kind === "click") tone(520, 0, 0.07, 0.12, "triangle");
    if (kind === "start") { tone(110, 0, 0.4, 0.3, "triangle"); tone(165, 0.12, 0.5, 0.2, "triangle"); }
    if (kind === "warning") { tone(660, 0, 0.2, 0.22); tone(440, 0.25, 0.2, 0.22); }
    if (kind === "complete") [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(frequency, index * 0.13, 0.4, 0.2));
    if (kind === "steam") {
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.65), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1200;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      source.connect(filter).connect(gain).connect(master);
      transients.add(source);
      source.onended = () => { transients.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start();
    }
  }, []);

  const narrate = useCallback((text: string) => {
    if (!enabledRef.current) {
      setNarrationStatus("Aktifkan suara untuk mendengarkan narasi. Transkrip tetap dapat dibaca.");
      return;
    }
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setNarrationStatus("Narasi suara tidak didukung peramban ini. Silakan baca transkrip.");
      return;
    }
    cancelSpeech();
    const voice = window.speechSynthesis.getVoices().find((candidate) => /^id(?:-|$)/i.test(candidate.lang));
    if (!voice) {
      setNarrationStatus("Suara bahasa Indonesia belum tersedia di perangkat ini. Gunakan transkrip atau coba narasi lagi setelah suara terpasang.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = "id-ID";
    utterance.rate = 0.93;
    utterance.volume = 0.85;
    utterance.onend = () => { utteranceRef.current = null; setNarrationStatus("Narasi selesai. Kamu dapat memutarnya kembali."); };
    utterance.onerror = () => { utteranceRef.current = null; setNarrationStatus("Narasi tidak dapat diputar. Silakan baca transkrip."); };
    utteranceRef.current = utterance;
    setNarrationStatus("Narasi sedang diputar dalam bahasa Indonesia.");
    window.speechSynthesis.speak(utterance);
  }, [cancelSpeech]);

  const stopNarration = useCallback(() => {
    cancelSpeech();
    setNarrationStatus("Narasi dihentikan. Transkrip tetap dapat dibaca.");
  }, [cancelSpeech]);

  useEffect(() => () => {
    cancelSpeech();
    const audio = audioRef.current;
    if (!audio) return;
    audio.engine.stop();
    audio.pulse.stop();
    audio.transients.forEach((source) => { try { source.stop(); } catch { /* Already ended. */ } });
    audio.engine.disconnect();
    audio.pulse.disconnect();
    audio.pulseGain.disconnect();
    audio.engineGain.disconnect();
    audio.master.disconnect();
    void audio.context.close().catch(() => {});
    audioRef.current = null;
  }, [cancelSpeech]);

  return { enabled, toggle, play, setEngineSpeed, narrate, stopNarration, narrationStatus };
}
