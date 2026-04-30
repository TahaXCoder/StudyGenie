import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Loader2, CheckCircle2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentUpload = ({ onUpload, onClose, onCancel, isUploading }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, done
  const [subject, setSubject] = useState('General');

  const onDrop = useCallback((acceptedFiles) => {
    setStatus('uploading');
    setUploadProgress(20);
    // Add subject to files (simulated for UI)
    const filesWithTags = acceptedFiles.map(file => {
      file.tag = subject;
      return file;
    });
    onUpload(filesWithTags);
  }, [onUpload, subject]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  return (
    <div className="upload-overlay">
      <div className="upload-modal glass animate-fade-in">
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        )}
        
        <div className="tag-selector glass">
          <Tag size={16} />
          <span>Subject:</span>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="General">General</option>
            <option value="Operating Systems">Operating Systems</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Web Development">Web Development</option>
          </select>
        </div>

        {isUploading ? (
          <div className="dropzone disabled">
            <div className="processing-state">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Loader2 size={48} className="spinner" />
              </motion.div>
              <h4>Processing documents...</h4>
              
              <div className="progress-wrapper">
                 <div className="progress-info">
                   <span>{uploadProgress}% — Creating embeddings...</span>
                 </div>
                 <div className="progress-container">
                    <motion.div 
                      className="progress-bar" 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress > 0 ? uploadProgress : 65}%` }}
                    />
                 </div>
              </div>
              
              <button 
                className="cancel-upload-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
              >
                Cancel Upload
              </button>
            </div>
          </div>
        ) : (
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={40} className="upload-icon" />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag & drop files here, or click to select</p>
            )}
            <span className="file-hint">Supported formats: PDF, TXT, DOCX</span>
          </div>
        )}

        <div className="upload-footer">
          {onClose && (
            <button className="glow-button" onClick={onClose}>Done</button>
          )}
        </div>
      </div>


    </div>
  );
};

export default DocumentUpload;
