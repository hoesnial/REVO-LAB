"use client";

import { useEffect, useId, useRef } from "react";
import { ArrowRight, Check, Circle, CircleDot, RotateCcw, Trophy, X } from "lucide-react";
import { quizQuestions } from "@/lib/revo/content";
import { scoreReflection, type ReflectionProgress } from "@/lib/revo/progress";

interface QuizPanelProps {
  progress: ReflectionProgress;
  onProgress: (progress: ReflectionProgress) => void;
  onComplete: (score: number) => void;
  onClose: () => void;
}

export function QuizPanel({ progress, onProgress, onComplete, onClose }: QuizPanelProps) {
  const id = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const actionLocked = useRef(false);
  const step = Math.min(progress.answers.length, quizQuestions.length - 1);
  const selected = progress.draftAnswer;
  const answered = progress.checked;
  const score = progress.resultAnswers ? scoreReflection(progress.resultAnswers) : 0;
  const finished = progress.resultAnswers !== null && !progress.retaking;
  const question = quizQuestions[step];
  const correct = selected === question.answer;

  useEffect(() => { actionLocked.current = false; }, [progress.answers, progress.checked, progress.draftAnswer, progress.resultAnswers, progress.retaking]);

  const focusTitle = () => requestAnimationFrame(() => titleRef.current?.focus());

  const advance = () => {
    if (!answered || selected === null || actionLocked.current) return;
    actionLocked.current = true;
    const answers = [...progress.answers, selected];
    if (step === quizQuestions.length - 1) {
      onProgress({ ...progress, answers, draftAnswer: null, checked: false, resultAnswers: answers, retaking: false });
      onComplete(scoreReflection(answers));
    } else {
      onProgress({ ...progress, answers, draftAnswer: null, checked: false });
    }
    focusTitle();
  };

  const retry = () => {
    actionLocked.current = true;
    onProgress({ ...progress, answers: [], draftAnswer: null, checked: false, retaking: true });
    focusTitle();
  };

  return (
    <section className="revo-quiz" aria-labelledby={`${id}-title`}>
      <div className="revo-quiz-heading">
        <div>
          <span className="revo-eyebrow">TAHAP 04 / REFLEKSI</span>
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
          if (selected === null || answered || actionLocked.current) return;
          actionLocked.current = true;
          onProgress({ ...progress, checked: true });
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
                <label className={`revo-quiz-option revo-answer-card ${state}`} key={`${step}-${index}`}>
                  <input type="radio" aria-label={option} aria-describedby={`${id}-answer-state-${index}`} name={`${id}-answer`} value={index} checked={selected === index} onChange={() => onProgress({ ...progress, draftAnswer: index, checked: false })} />
                  <span className="revo-quiz-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                  <span className="revo-answer-copy">{option}<span id={`${id}-answer-state-${index}`} className="revo-answer-state">{answered && index === question.answer ? selected === index ? "Jawabanmu · benar" : "Jawaban benar" : answered && selected === index ? "Jawabanmu · belum tepat" : selected === index ? "Dipilih · belum diperiksa" : ""}</span></span>
                  <span className="revo-answer-marker" aria-hidden="true">{answered && index === question.answer ? <Check size={20} /> : answered && selected === index ? <X size={20} /> : selected === index ? <CircleDot size={20} /> : <Circle size={20} />}</span>
                </label>
              );
            })}
          </fieldset>
          <div className={`revo-quiz-feedback ${answered ? correct ? "is-correct" : "is-incorrect" : ""}`} aria-live="polite" aria-atomic="true">
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
