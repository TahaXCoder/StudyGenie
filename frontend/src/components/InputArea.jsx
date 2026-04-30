import React, { useState } from 'react';
import { Send, Paperclip, Sparkles, FileText, HelpCircle, Brain, Square } from 'lucide-react';
import { motion } from 'framer-motion';

const InputArea = ({ onSendMessage, isThinking, onStop }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (input.trim()) {
      onSendMessage(input, mode);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const modes = [
    { id: 'chat', label: 'Chat', icon: <Sparkles size={14} /> },
    { id: 'summarize', label: 'Summarize', icon: <FileText size={14} /> },
    { id: 'quiz', label: 'Quiz Me', icon: <HelpCircle size={14} /> },
    { id: 'explain', label: 'Explain', icon: <Brain size={14} /> },
  ];

  return (
    <div className="input-container-wrapper">

      <div className="mode-switcher glass">
        {modes.map((m) => (
          <button 
            key={m.id} 
            className={`mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <form className="input-form glass" onSubmit={handleSubmit}>
        <button type="button" className="icon-btn">
          <Paperclip size={20} />
        </button>
        <textarea
          rows="1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask StudyGenie anything (${mode})...`}
          className="chat-input"
        />
        {isThinking ? (
          <button type="button" className="send-btn stop-btn" onClick={onStop}>
            <Square size={20} fill="currentColor" />
          </button>
        ) : (
          <button type="submit" className="send-btn" disabled={!input.trim()}>
            <Send size={20} />
          </button>
        )}
      </form>
    </div>
  );
};

export default InputArea;
