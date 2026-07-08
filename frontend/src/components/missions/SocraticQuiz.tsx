'use client';

import { useState } from 'react';
import type { QuizQuestion } from '@/types/rocket';

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Why is it more effective to increase Specific Impulse (Isp) than to simply add more fuel?",
    options: [
      "Fuel adds dead weight (mass ratio), whereas higher Isp increases exhaust velocity directly.",
      "Higher Isp makes the rocket lighter on the launchpad.",
      "Adding fuel increases atmospheric friction exponentially.",
      "Engines with lower Isp burn fuel too slowly to escape gravity."
    ],
    answerIndex: 0,
    explanation: "According to the Tsiolkovsky rocket equation, Delta-V increases linearly with Isp but only logarithmically with the mass ratio (wet mass / dry mass). Adding more fuel increases the wet mass, which requires even more fuel to lift itself!"
  },
  {
    question: "If a rocket's dry mass is 10,000 kg and fuel mass is 30,000 kg, what is its mass ratio (R)?",
    options: [
      "R = 3.0",
      "R = 4.0",
      "R = 1.33",
      "R = 0.25"
    ],
    answerIndex: 1,
    explanation: "Mass ratio (R) is calculated as Total Wet Mass divided by Dry Mass. Wet Mass = Dry Mass (10,000 kg) + Fuel Mass (30,000 kg) = 40,000 kg. R = 40,000 / 10,000 = 4.0."
  },
  {
    question: "What does Specific Impulse (Isp) physically represent?",
    options: [
      "The total payload capacity of the booster.",
      "The thrust produced per unit of propellant flow rate (efficiency).",
      "The aerodynamic coefficient of drag at Max-Q.",
      "The time it takes for a rocket to clear the tower."
    ],
    answerIndex: 1,
    explanation: "Specific Impulse is a measure of engine efficiency. It represents the thrust obtained per unit rate of fuel consumption, measured in seconds."
  }
];

interface SocraticQuizProps {
  onCorrectAnswer: (points: number) => void;
}

export default function SocraticQuiz({ onCorrectAnswer }: SocraticQuizProps) {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleAnswerSubmit = (index: number) => {
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === QUIZ_QUESTIONS[currentQuizIndex].answerIndex) {
      setQuizScore(prev => prev + 1);
      onCorrectAnswer(15); // Award 15 stars per correct answer!
    }
  };

  const nextQuizQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-between min-h-[280px]">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-semibold text-purple-400 flex items-center gap-1.5">
            <span>💡</span> Orbital Physics Quiz
          </h3>
          <span className="text-xs text-slate-500">Question {currentQuizIndex + 1}/{QUIZ_QUESTIONS.length}</span>
        </div>

        {!quizCompleted ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {QUIZ_QUESTIONS[currentQuizIndex].question}
            </p>
            
            <div className="space-y-2">
              {QUIZ_QUESTIONS[currentQuizIndex].options.map((opt, i) => (
                <button
                  key={i}
                  disabled={showExplanation}
                  onClick={() => handleAnswerSubmit(i)}
                  className={`w-full p-2.5 text-left text-xs rounded-lg border transition-all cursor-pointer ${
                    selectedAnswer === i
                      ? i === QUIZ_QUESTIONS[currentQuizIndex].answerIndex
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                        : 'bg-red-500/10 border-red-500 text-red-300'
                      : showExplanation && i === QUIZ_QUESTIONS[currentQuizIndex].answerIndex
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950/40 border-white/5 text-slate-300 hover:border-white/10 hover:bg-slate-950/70'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {showExplanation && (
              <div className="p-3 bg-slate-950/60 border-l-2 border-purple-500 rounded text-[10px] text-slate-400 leading-relaxed">
                {QUIZ_QUESTIONS[currentQuizIndex].explanation}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <span className="text-4xl block">🏆</span>
            <h4 className="text-md font-bold text-white">Quiz Completed!</h4>
            <p className="text-xs text-slate-400">
              You scored <span className="font-bold text-purple-400">{quizScore}</span> out of {QUIZ_QUESTIONS.length} correct.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-2 border-t border-white/5 flex justify-end">
        {!quizCompleted ? (
          showExplanation && (
            <button 
              onClick={nextQuizQuestion}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-all font-semibold"
            >
              {currentQuizIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'Finish Quiz'}
            </button>
          )
        ) : (
          <button 
            onClick={resetQuiz}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-all font-semibold"
          >
            Reset Quiz
          </button>
        )}
      </div>
    </div>
  );
}
