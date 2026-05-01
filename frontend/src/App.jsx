import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import DocumentUpload from './components/DocumentUpload';
import Auth from './components/Auth';
import { chatStream, uploadDocument, resetIndex } from './services/api';
import { Toaster, toast } from 'react-hot-toast';
import { useHotkeys } from 'react-hotkeys-hook';
import { Menu, X, Moon, Sun, Keyboard, Search, BookOpen } from 'lucide-react';
import { QuizModal } from './components/StudyTools';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I'm StudyGenie, your intelligent AI study assistant. 📚\n\nYou can upload your PDFs or notes, and I can:\n* **Summarize** complex chapters\n* Generate **Quizzes** to test your knowledge\n* Create **Flashcards** for quick revision\n* **Explain** difficult topics in simple terms\n\nHow can I help you today?" }
  ]);
  const [showUpload, setShowUpload] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadController, setUploadController] = useState(null);
  const [chatController, setChatController] = useState(null);
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [chats, setChats] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentChatTitle, setCurrentChatTitle] = useState('New Study Session');
  const [previewDoc, setPreviewDoc] = useState(null);

  // Apply theme to body
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Removed auto-reset on initial load to prevent Vectorize propagation delays
  // The index will now only clear when handleNewSession is manually triggered.

  // Keyboard Shortcuts
  useHotkeys('ctrl+k', (e) => {
    e.preventDefault();
    handleNewSession();
  });
  useHotkeys('ctrl+u', (e) => {
    e.preventDefault();
    setShowUpload(true);
  });
  useHotkeys('ctrl+/', (e) => {
    e.preventDefault();
    toast('Shortcuts: Ctrl+K (New Chat), Ctrl+U (Upload), Ctrl+/ (Help)', { icon: '⌨️' });
  });

  const handleNewSession = async () => {
    setMessages([{ role: 'ai', content: "Hello! I'm StudyGenie. How can I help you today?" }]);
    setCurrentChatTitle('New Study Session');
    
    // If guest user, clear the index as requested
    if (!user) {
      try {
        await resetIndex();
        setDocuments([]);
        toast.success('New session: Previous sources cleared');
      } catch (err) {
        console.error('Failed to reset index:', err);
      }
    } else {
      toast.success('New chat started');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSendMessage = async (content, mode = 'chat') => {
    // Session auto-naming
    if (messages.length === 1) {
      const firstWords = content.split(' ').slice(0, 4).join(' ');
      setCurrentChatTitle(firstWords + (content.split(' ').length > 4 ? '...' : ''));
    }

    // Add user message
    const userMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);

    // Prepare AI response placeholder
    const aiMessagePlaceholder = { role: 'ai', content: '', sources: [] };
    setMessages((prev) => [...prev, aiMessagePlaceholder]);
    setIsThinking(true);

    let fullResponse = '';
    
    const controller = chatStream(
      content,
      (chunk) => {
        fullResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { ...newMessages[lastIndex], content: fullResponse };
          return newMessages;
        });
      },
      (sources) => {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { ...newMessages[lastIndex], sources };
          return newMessages;
        });
      },
      (error) => {
        console.error('Chat Error:', error);
        setIsThinking(false);
        setChatController(null);
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { 
            ...newMessages[lastIndex], 
            content: "Sorry, I encountered an error connecting to the backend. Please make sure the server is running." 
          };
          return newMessages;
        });
      },
      () => {
        setIsThinking(false);
        setChatController(null);
      }
    );

    setChatController(controller);
  };

  const handleStopGeneration = () => {
    if (chatController) {
      chatController.abort();
      setChatController(null);
      setIsThinking(false);
      toast('Generation stopped', { icon: '⏹️' });
    }
  };

  const handleFileUpload = async (files) => {
    setIsUploading(true);
    const controller = new AbortController();
    setUploadController(controller);
    let allSucceeded = true;
    let newDocs = [];

    try {
      for (const file of files) {
        if (controller.signal.aborted) {
          allSucceeded = false;
          break;
        }
        await uploadDocument(file, undefined, controller);
        newDocs.push({ name: file.name });
      }
      
      setIsUploading(false);
      setShowUpload(false);
      setUploadController(null);
      
      if (newDocs.length > 0) {
        setDocuments(prev => [...prev, ...newDocs]);
        const systemMessage = { 
          role: 'ai', 
          content: `Successfully processed ${newDocs.length} document(s). You can now ask questions about them!`,
          sources: newDocs.map(f => f.name)
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      setIsUploading(false);
      setUploadController(null);
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
        toast.error(`Failed to upload documents: ${errorMsg}`);
      }
    }
  };

  const handleCancelUpload = () => {
    if (uploadController) {
      uploadController.abort();
    }
    setIsUploading(false);
    setShowUpload(false);
    setUploadController(null);
  };

  // Render main app directly without blocking
  return (
    <div className="app-container">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--border-color)',
          }
        }}
      />
      
      <Sidebar 
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onUploadClick={() => setShowUpload(true)} 
        onLogout={() => setUser(null)}
        onNewChat={handleNewSession}
        documents={documents}
        chats={chats}
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onPreviewDoc={(doc) => setPreviewDoc(doc)}
      />
      
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="background-glow animate-float"></div>
        
        <header className="app-header glass">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="header-info">
              <h2>{currentChatTitle}</h2>
              <p>Active Session</p>
            </div>
          </div>
          
          <div className="header-center">
            <div className="search-bar glass">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search in this conversation..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-actions">
             <button className="icon-btn theme-toggle" onClick={() => setShowQuiz(true)} title="Take a Quiz">
                <BookOpen size={20} />
             </button>
             <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
        </header>

        {messages.length <= 1 && documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">📚</div>
            <h2>No documents yet</h2>
            <p>Drop your notes here to get started or click Upload Docs</p>
            <button className="glow-button" onClick={() => setShowUpload(true)} style={{ marginTop: '20px' }}>
              Upload First Document
            </button>
          </div>
        ) : (
          <ChatArea 
            messages={messages.filter(m => 
              m.content.toLowerCase().includes(searchQuery.toLowerCase())
            )} 
            isThinking={isThinking} 
          />
        )}
        
        <InputArea 
          onSendMessage={handleSendMessage} 
          isThinking={isThinking} 
          onStop={handleStopGeneration} 
        />
      </main>

      <QuizModal isOpen={showQuiz} onClose={() => setShowQuiz(false)} />

      {previewDoc && (
        <div className="upload-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="upload-modal glass preview-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setPreviewDoc(null)}><X size={20} /></button>
            <div className="modal-header">
              <h3>{previewDoc.name}</h3>
              <p>Document Preview</p>
            </div>
            <div className="preview-content glass">
               <div className="preview-placeholder">
                  <BookOpen size={48} />
                  <p>Previewing first page of {previewDoc.name}...</p>
                  <div className="text-skeleton"></div>
                  <div className="text-skeleton"></div>
                  <div className="text-skeleton" style={{ width: '60%' }}></div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <DocumentUpload 
          onUpload={handleFileUpload} 
          onClose={!isUploading ? () => setShowUpload(false) : undefined} 
          onCancel={handleCancelUpload}
          isUploading={isUploading}
        />
      )}

      {showAuthModal && (
        <Auth 
          onLogin={(userData) => {
            setUser(userData);
            setShowAuthModal(false);
            toast.success(`Welcome back, ${userData.name || 'Student'}!`);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}

export default App;
