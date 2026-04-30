import React, { useState } from 'react';
import { Mail, Lock, User, BookOpen, ArrowRight, X } from 'lucide-react';

const Auth = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate login for now
    onLogin(formData);
  };

  const handleGoogleLogin = () => {
    // Simulate successful Google auth until backend is setup
    onLogin({ name: "Google User", email: "user@google.com", isGoogleAuth: true });
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass animate-fade-in" style={{ position: 'relative' }}>
        {onClose && (
          <button className="close-btn" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        )}
        
        <div className="auth-header">
          <div className="brand">
            <BookOpen className="brand-icon" />
            <span>StudyGenie</span>
          </div>
          <h1>{isLogin ? 'Welcome Back' : 'Join StudyGenie'}</h1>
          <p>{isLogin ? 'Access your intelligent study assistant' : 'Start your journey to smarter learning'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <User className="input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button type="submit" className="glow-button auth-submit">
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={20} />
          </button>

          <div style={{ textAlign: "center", margin: "16px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            <span>OR</span>
          </div>

          <button 
            type="button" 
            className="glass" 
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "12px", borderRadius: "16px", border: "1px solid var(--border-color)", cursor: "pointer", background: "transparent", color: "white" }} 
            onClick={handleGoogleLogin}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>


    </div>
  );
};

export default Auth;
