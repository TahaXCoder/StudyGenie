import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, ThumbsUp, ThumbsDown, Copy, RotateCcw, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ChatArea = ({ messages, isThinking }) => {
  const [copiedId, setCopiedId] = React.useState(null);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedId(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedQuestions = [
    "Explain this in simpler terms",
    "Give me a real-world example",
    "Create a 5-question quiz on this",
    "What are the key takeaways?"
  ];

  const renderMessageContent = (content) => {
    // Remove <think>...</think> blocks
    const cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return cleanedContent;
  };

  return (
    <div className="chat-container" ref={scrollRef}>
      {messages.map((msg, index) => {
        const displayContent = msg.role === 'ai' ? renderMessageContent(msg.content) : msg.content;
        
        // Don't render empty AI messages (if they were only thoughts)
        if (msg.role === 'ai' && !displayContent && !isThinking) return null;

        return (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`message ${msg.role}`}
          >
            <div className="message-header">
              {msg.role === 'user' ? (
                <><User size={16} /> <span>You</span></>
              ) : (
                <><Bot size={16} /> <span>StudyGenie</span></>
              )}
            </div>
            <div className="message-content">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {displayContent}
              </ReactMarkdown>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="sources">
                  <span className="source-label">Sources:</span>
                  {msg.sources.map((source, i) => (
                    <span key={i} className="source-tag">{source}</span>
                  ))}
                </div>
              )}

              {msg.role === 'ai' && displayContent && (
                <div className="message-actions">
                  <button className="action-btn" onClick={() => handleCopy(displayContent, index)} title="Copy">
                    {copiedId === index ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button className="action-btn" title="Regenerate">
                    <RotateCcw size={14} />
                  </button>
                  <div className="reaction-group">
                    <button className="action-btn" title="Helpful">
                      <ThumbsUp size={14} />
                    </button>
                    <button className="action-btn" title="Not Helpful">
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {isThinking && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="message ai thinking"
          >
            <div className="message-header">
              <Bot size={16} /> <span>StudyGenie is thinking...</span>
            </div>
            <div className="thinking-dots">
              <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
              <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
              <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isThinking && messages.length > 1 && messages[messages.length - 1].role === 'ai' && (
        <div className="suggested-questions">
          <p>You might also ask:</p>
          <div className="questions-grid">
            {suggestedQuestions.map((q, i) => (
              <button key={i} className="question-chip">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
