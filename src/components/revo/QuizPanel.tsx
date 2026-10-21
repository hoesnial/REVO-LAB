"use client";

import { useId, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, Trophy, X } from "lucide-react";
import { quizQuestions } from "@/lib/revo/content";

interface QuizPanelProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

export function QuizPanel({ onComplete, onClose }: QuizPanelProps) {
  const id = useId();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const question = quizQuestions[step];
  const correct = selected === question.answer;

  const focusTitle = () => requestAnimationFrame(() => titleRef.current?.focus());

  const advance = () => {
    if (step === quizQuestions.length - 1) {
      setFinished(true);
      onComplete(score);
    } else {
      setStep(step + 1);
      setSelected(null);
      setAnswered(false);
    }
    focusTitle();
  };

  const retry = () => {
    setStep(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    focusTitle();
  };

  return (
    <section className="revo-quiz" aria-labelledby={`${id}-title`}>
      <div className="revo-quiz-heading">
        <div>
          <span className="revo-eyebrow">TAHAP 03 / REFLEKSI</span>
          <h2 id={`${id}-title`} ref={titleRef} tabIndex={-1}>
            {finished ? "Jejak belajarmu" : "Di balik putaran mesin"}
          </h2>
        </div>
        <button type="button" className="revo-icon-button" onClick={onClose} aria-label="Tutup evaluasi">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {finished ? (
        <div className="revo-quiz-result">
          <div className="revo-quiz-trophy"><Trophy size={32} aria-hidden="true" /></div>
          <span className="revo-quiz-score">{score}<small> / {quizQuestions.length}</small></span>
          <h3>{score === quizQuestions.length ? "Kamu memahami tenaga perubahan." : "Setiap percobaan membawa pemahaman."}</h3>
          <p>
            {score === quizQuestions.length
              ? "Kamu telah menghubungkan cara kerja mesin dengan perubahan produksi dan kehidupan manusia."
              : "Tinjau kembali komponen dan penjelasan jawaban. Kamu dapat mengulang evaluasi kapan saja."}
          </p>
          <div className="revo-quiz-takeaway">
            <strong>Untuk direnungkan</strong>
            <p>Jika produksi meningkat, apakah kehidupan semua orang ikut membaik? Pertimbangkan pemilik pabrik, buruh, dan lingkungan.</p>
          </div>
          <div className="revo-quiz-actions">
            <button type="button" className="revo-button revo-button-secondary" onClick={retry}>
              <RotateCcw size={16} aria-hidden="true" /> Ulangi evaluasi
            </button>
            <button type="button" className="revo-button revo-button-primary" onClick={onClose}>
              Kembali ke laboratorium <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => {
          event.preventDefault();
          if (selected === null || answered) return;
          if (correct) setScore((current) => current + 1);
          setAnswered(true);
        }}>
          <div className="revo-quiz-progress">
            <span>Pertanyaan {step + 1} dari {quizQuestions.length}</span>
            <div aria-hidden="true">
              {quizQuestions.map((_, index) => <i key={index} className={index <= step ? "is-active" : ""} />)}
            </div>
          </div>
          <fieldset className="revo-quiz-options" disabled={answered}>
            <legend>{question.question}</legend>
            {question.options.map((option, index) => {
              const state = answered ? index === question.answer ? "is-correct" : selected === index ? "is-incorrect" : "" : selected === index ? "is-selected" : "";
              return (
                <label className={`revo-quiz-option ${state}`} key={`${step}-${index}`}>
                  <input type="radio" name={`${id}-answer`} value={index} checked={selected === index} onChange={() => setSelected(index)} />
                  <span className="revo-quiz-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                  <span>{option}</span>
                  {answered && index === question.answer && <Check size={18} aria-label="Jawaban benar" />}
                  {answered && selected === index && index !== question.answer && <X size={18} aria-label="Jawaban belum tepat" />}
                </label>
              );
            })}
          </fieldset>
          <div className="revo-quiz-feedback" aria-live="polite" aria-atomic="true">
            {answered && <>
              <strong>{correct ? "Tepat!" : "Belum tepat. Mari kita pelajari."}</strong>
              <p>{question.explanation}</p>
            </>}
          </div>
          <div className="revo-quiz-actions">
            {answered ? (
              <button type="button" className="revo-button revo-button-primary" onClick={advance}>
                {step === quizQuestions.length - 1 ? "Lihat hasil" : "Pertanyaan berikutnya"} <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" className="revo-button revo-button-primary" disabled={selected === null}>
                Periksa jawaban <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

export default QuizPanel;
