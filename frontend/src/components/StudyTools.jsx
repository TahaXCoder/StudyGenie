import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle2, RefreshCw } from 'lucide-react';

export const QuizModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const questions = [
    {
      q: "What is Round Robin scheduling?",
      options: ["A) FCFS algorithm", "B) Fixed time quantum", "C) Priority based", "D) Shortest job first"],
      correct: 1
    },
    {
      q: "Which layer of the OSI model handles routing?",
      options: ["A) Physical", "B) Data Link", "C) Network", "D) Transport"],
      correct: 2
    },
    {
      q: "What does 'R' in RAG stand for?",
      options: ["A) Rapid", "B) Retrieval", "C) Recursive", "D) Random"],
      correct: 1
    }
  ];

  const handleNext = () => {
    if (selectedOption === questions[currentStep].correct) {
      setScore(score + 1);
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="upload-overlay" style={{ zIndex: 2000 }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="upload-modal glass quiz-modal"
      >
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        
        {!showResult ? (
          <>
            <div className="quiz-header">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <div className="progress-container" style={{ height: '6px' }}>
                <div className="progress-bar" style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}></div>
              </div>
            </div>

            <div className="quiz-content">
              <h3>{questions[currentStep].q}</h3>
              <div className="options-grid">
                {questions[currentStep].options.map((opt, i) => (
                  <button 
                    key={i} 
                    className={`option-btn ${selectedOption === i ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(i)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="quiz-footer">
              <button className="icon-btn" disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>
                <ChevronLeft /> Previous
              </button>
              <button className="glow-button" disabled={selectedOption === null} onClick={handleNext}>
                {currentStep === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="quiz-result">
            <CheckCircle2 size={64} color="var(--accent)" />
            <h2>Quiz Completed!</h2>
            <p>You scored {score} out of {questions.length}</p>
            <button className="glow-button" onClick={onClose}>Close</button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const Flashcard = ({ question, answer }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flashcard-container" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div 
        className="flashcard"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="flashcard-front glass">
          <p className="card-label">Question</p>
          <h3>{question}</h3>
          <p className="click-hint">Click to flip</p>
        </div>
        <div className="flashcard-back glass" style={{ transform: "rotateY(180deg)" }}>
          <p className="card-label">Answer</p>
          <h3>{answer}</h3>
          <p className="click-hint">Click to flip back</p>
        </div>
      </motion.div>
    </div>
  );
};
