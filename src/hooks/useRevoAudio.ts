"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SoundKind = "click" | "start" | "steam" | "warning" | "complete" | "level-complete" | "coal" | "water" | "place" | "reject";
type NarrationPlayback = "idle" | "playing" | "paused";

interface EngineAudio {
  context: AudioContext;
  master: GainNode;
  engineGain: GainNode;
  engine: OscillatorNode;
  wheelGain: GainNode;
  wheel: OscillatorNode;
  loomGain: GainNode;
  loom: OscillatorNode;
  pulseGain: GainNode;
  pulse: OscillatorNode;
  steamBuffer: AudioBuffer;
  transients: Set<AudioScheduledSourceNode>;
}

/** One lazily-created Web Audio graph serves feedback and the simulation bed. */
export function useRevoAudio() {
  const [enabled, setEnabled] = useState(false);
  const [narrationStatus, setNarrationStatus] = useState("Aktifkan suara untuk mendengarkan narasi.");
  const [narrationPlayback, setNarrationPlayback] = useState<NarrationPlayback>("idle");
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

  const stopEffects = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.context.state === "closed") return;
    const stopAt = audio.context.state === "running" ? audio.context.currentTime + 0.12 : audio.context.currentTime;
    audio.transients.forEach(source => { try { source.stop(stopAt); } catch { /* The transient already ended. */ } });
  }, []);

  const setEngineSpeed = useCallback((value: number) => {
    const speed = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    speedRef.current = speed;
    const audio = audioRef.current;
    if (!audio || audio.context.state === "closed") return;
    const now = audio.context.currentTime;
    const fade = 0.2;
    audio.engine.frequency.setTargetAtTime(38 + speed * 0.7, now, fade);
    audio.wheel.frequency.setTargetAtTime(32 + speed * 0.48, now, fade);
    audio.loom.frequency.setTargetAtTime(78 + speed * 1.42, now, fade);
    audio.pulse.frequency.setTargetAtTime(1.2 + speed * 0.085, now, fade);
    audio.engineGain.gain.setTargetAtTime(speed > 0 ? 0.026 + speed * 0.00062 : 0, now, fade);
    audio.wheelGain.gain.setTargetAtTime(speed > 0 ? 0.012 + speed * 0.00019 : 0, now, fade);
    audio.loomGain.gain.setTargetAtTime(speed > 0 ? 0.005 + speed * 0.00012 : 0, now, fade);
    audio.pulseGain.gain.setTargetAtTime(speed > 0 ? 0.005 + speed * 0.00008 : 0, now, fade);
  }, []);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    if (!next) {
      cancelSpeech();
      setNarrationPlayback("idle");
      setNarrationStatus("Suara dinonaktifkan. Transkrip tetap dapat dibaca.");
      const audio = audioRef.current;
      if (audio && audio.context.state !== "closed") {
        audio.master.gain.cancelScheduledValues(audio.context.currentTime);
        audio.master.gain.setTargetAtTime(0, audio.context.currentTime, 0.09);
      }
      stopEffects();
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

        const wheel = context.createOscillator();
        wheel.type = "sine";
        const wheelGain = context.createGain();
        wheelGain.gain.value = 0;
        wheel.connect(wheelGain).connect(master);

        const loom = context.createOscillator();
        loom.type = "triangle";
        const loomGain = context.createGain();
        loomGain.gain.value = 0;
        loom.connect(loomGain).connect(master);

        const pulse = context.createOscillator();
        pulse.type = "square";
        const pulseGain = context.createGain();
        pulseGain.gain.value = 0;
        pulse.connect(pulseGain).connect(engineGain.gain);

        const steamBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.65), context.sampleRate);
        const noise = steamBuffer.getChannelData(0);
        for (let index = 0; index < noise.length; index++) noise[index] = Math.random() * 2 - 1;

        engine.start(); wheel.start(); loom.start(); pulse.start();
        audioRef.current = { context, master, engineGain, engine, wheelGain, wheel, loomGain, loom, pulseGain, pulse, steamBuffer, transients: new Set() };
      }
      const audio = audioRef.current;
      // resume() is called synchronously from the user's sound-toggle action.
      void audio.context.resume().catch(() => {
        setNarrationStatus("Peramban belum mengizinkan audio. Nonaktifkan lalu aktifkan suara untuk mencoba lagi.");
      });
      audio.master.gain.cancelScheduledValues(audio.context.currentTime);
      audio.master.gain.setTargetAtTime(0.24, audio.context.currentTime, 0.08);
      setEngineSpeed(speedRef.current);
    } catch {
      setNarrationStatus("Audio tidak tersedia. Kamu tetap dapat membaca semua penjelasan.");
    }
  }, [cancelSpeech, setEngineSpeed, stopEffects]);

  const play = useCallback((kind: SoundKind) => {
    const audio = audioRef.current;
    if (!enabledRef.current || !audio || audio.context.state !== "running") return;
    const { context, master, transients } = audio;
    const now = context.currentTime;

    const tone = (frequency: number, delay: number, duration: number, volume = 0.18, type: OscillatorType = "sine") => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(volume, now + delay + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      oscillator.connect(gain).connect(master);
      transients.add(oscillator);
      oscillator.onended = () => { transients.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(now + delay);
      oscillator.stop(now + delay + duration + 0.02);
    };

    if (kind === "click") tone(520, 0, 0.07, 0.08, "triangle");
    if (kind === "coal") { tone(145, 0, 0.11, 0.1, "triangle"); tone(95, 0.08, 0.13, 0.08, "triangle"); }
    if (kind === "water") { tone(430, 0, 0.14, 0.08); tone(620, 0.09, 0.15, 0.065); }
    if (kind === "place") { tone(660, 0, 0.12, 0.09, "triangle"); tone(880, 0.07, 0.16, 0.075, "triangle"); }
    if (kind === "reject") { tone(245, 0, 0.09, 0.06, "triangle"); tone(195, 0.08, 0.11, 0.05, "triangle"); }
    if (kind === "start") { tone(110, 0, 0.4, 0.2, "triangle"); tone(165, 0.12, 0.5, 0.14, "triangle"); }
    if (kind === "warning") { tone(660, 0, 0.18, 0.14); tone(440, 0.24, 0.19, 0.14); }
    if (kind === "complete") [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(frequency, index * 0.13, 0.36, 0.13));
    if (kind === "level-complete") [392, 523.25, 659.25, 783.99].forEach((frequency, index) => tone(frequency, index * 0.16, 0.48, 0.12));
    if (kind === "steam") {
      const source = context.createBufferSource();
      source.buffer = audio.steamBuffer;
      const filter = context.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1100;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.13, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      source.connect(filter).connect(gain).connect(master);
      transients.add(source);
      source.onended = () => { transients.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(now);
      source.stop(now + 0.68);
    }
  }, []);

  const narrate = useCallback((text: string) => {
    if (!enabledRef.current) {
      setNarrationPlayback("idle");
      setNarrationStatus("Aktifkan suara untuk mendengarkan narasi. Transkrip tetap dapat dibaca.");
      return;
    }
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setNarrationPlayback("idle");
      setNarrationStatus("Narasi suara tidak didukung peramban ini. Silakan baca transkrip.");
      return;
    }
    cancelSpeech();
    const voice = window.speechSynthesis.getVoices().find(candidate => /^id(?:-|$)/i.test(candidate.lang));
    if (!voice) {
      setNarrationPlayback("idle");
      setNarrationStatus("Suara bahasa Indonesia belum tersedia di perangkat ini. Gunakan transkrip atau coba lagi setelah suara terpasang.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = "id-ID";
    utterance.rate = 0.93;
    utterance.volume = 0.82;
    utterance.onend = () => { utteranceRef.current = null; setNarrationPlayback("idle"); setNarrationStatus("Narasi selesai. Putar ulang atau baca transkrip."); };
    utterance.onerror = () => { utteranceRef.current = null; setNarrationPlayback("idle"); setNarrationStatus("Narasi tidak dapat diputar. Silakan baca transkrip."); };
    utteranceRef.current = utterance;
    setNarrationPlayback("playing");
    setNarrationStatus("Narasi sedang diputar dalam bahasa Indonesia.");
    window.speechSynthesis.speak(utterance);
  }, [cancelSpeech]);

  const pauseNarration = useCallback(() => {
    if (!utteranceRef.current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setNarrationPlayback("paused");
    setNarrationStatus("Narasi dijeda. Pilih lanjutkan atau hentikan; transkrip tetap tersedia.");
  }, []);

  const resumeNarration = useCallback(() => {
    if (!utteranceRef.current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.resume();
    setNarrationPlayback("playing");
    setNarrationStatus("Narasi dilanjutkan.");
  }, []);

  const stopNarration = useCallback(() => {
    cancelSpeech();
    setNarrationPlayback("idle");
    setNarrationStatus("Narasi dihentikan. Transkrip tetap dapat dibaca.");
  }, [cancelSpeech]);

  useEffect(() => () => {
    cancelSpeech();
    const audio = audioRef.current;
    if (!audio) return;
    audio.engine.stop(); audio.wheel.stop(); audio.loom.stop(); audio.pulse.stop();
    audio.transients.forEach(source => { try { source.stop(); } catch { /* Already ended. */ } });
    audio.engine.disconnect(); audio.engineGain.disconnect();
    audio.wheel.disconnect(); audio.wheelGain.disconnect();
    audio.loom.disconnect(); audio.loomGain.disconnect();
    audio.pulse.disconnect(); audio.pulseGain.disconnect(); audio.master.disconnect();
    void audio.context.close().catch(() => {});
    audioRef.current = null;
  }, [cancelSpeech]);

  return { enabled, toggle, play, setEngineSpeed, stopEffects, narrate, pauseNarration, resumeNarration, stopNarration, narrationStatus, narrationPlayback };
}
