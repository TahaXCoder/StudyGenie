import React from 'react';
import { BookOpen, MessageSquare, Files, Settings, Plus, Trash2, Upload, LogOut, LogIn, User, Moon, Sun, BarChart2, Tag, Eye } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user, onLoginClick, onUploadClick, onLogout, onNewChat, chats = [], documents = [], theme, toggleTheme, isOpen, onClose, onPreviewDoc }) => {
  const [selectedDocs, setSelectedDocs] = React.useState([]);

  const toggleDocSelection = (docName) => {
    setSelectedDocs(prev => 
      prev.includes(docName) 
        ? prev.filter(name => name !== docName) 
        : [...prev, docName]
    );
  };

  const studyStats = {
    docsUploaded: documents.length,
    questionsAsked: 12, // Placeholder for actual stats
    quizzesTaken: 2,
    score: '85%'
  };

  return (
    <div className={`sidebar glass ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <BookOpen className="brand-icon" />
          <span>StudyGenie</span>
        </div>
        <button className="new-chat-btn glow-button" onClick={onNewChat}>
          <Plus size={20} />
          <span>New Session</span>
        </button>
        <button className="upload-btn glass" onClick={onUploadClick}>
          <Upload size={20} />
          <span>Upload Docs</span>
        </button>
      </div>

      {user && (
        <div className="stats-panel glass">
          <div className="nav-label"><BarChart2 size={14} /> Today's Progress</div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{studyStats.docsUploaded}</span>
              <span className="stat-label">Docs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{studyStats.questionsAsked}</span>
              <span className="stat-label">Qs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{studyStats.quizzesTaken}</span>
              <span className="stat-label">Quizzes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{studyStats.score}</span>
              <span className="stat-label">Score</span>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-content">
        <div className="nav-group">
          <div className="nav-label">Recent Chats</div>
          {!user ? (
            <div className="empty-nav login-prompt" onClick={onLoginClick} style={{ cursor: 'pointer' }}>
              <LogIn size={16} style={{ marginBottom: "8px" }} />
              <div>Log in to save your chats and sessions</div>
            </div>
          ) : chats.length > 0 ? (
            chats.map((chat, idx) => (
              <div key={idx} className={`nav-item ${idx === 0 ? 'active' : ''}`}>
                <MessageSquare size={18} />
                <span>{chat.title}</span>
              </div>
            ))
          ) : (
            <div className="empty-nav">No recent chats</div>
          )}
        </div>

        <div className="nav-group">
          <div className="nav-label">Your Documents</div>
          {!user ? (
            <div className="empty-nav">Log in to view documents</div>
          ) : documents.length > 0 ? (
            <>
              {documents.map((doc, idx) => (
                <div key={idx} className={`nav-item doc-item ${selectedDocs.includes(doc.name) ? 'selected' : ''}`} onClick={() => toggleDocSelection(doc.name)}>
                  <div className="doc-info">
                    <input 
                      type="checkbox" 
                      checked={selectedDocs.includes(doc.name)} 
                      onChange={() => {}} // Controlled by parent div
                      className="doc-checkbox"
                    />
                    <Files size={18} />
                    <span>{doc.name}</span>
                  </div>
                  <div className="doc-actions">
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); onPreviewDoc(doc); }} title="Preview">
                      <Eye size={14} />
                    </button>
                    {doc.tag && (
                      <div className="doc-tag">
                        <Tag size={10} />
                        <span>{doc.tag}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {selectedDocs.length > 0 && (
                <button className="chat-selected-btn">
                  Chat with selected ({selectedDocs.length})
                </button>
              )}
            </>
          ) : (
            <div className="empty-nav">No documents yet</div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="nav-item theme-toggle-sidebar" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </div>
        <div className="nav-item">
          <Settings size={18} />
          <span>Settings</span>
        </div>
        {user ? (
          <div className="nav-item logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        ) : (
          <div className="nav-item login-btn" onClick={onLoginClick}>
            <LogIn size={18} />
            <span>Log in / Sign up</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
