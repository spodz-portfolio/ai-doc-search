import React, { useRef, useState } from 'react';
import Modal from './Modal';
import { ragAPI } from '../services/ragAPI';
import './DocumentUploadModal.css';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface DocumentCategory {
  name: string;
  color: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined categories
  const predefinedCategories: DocumentCategory[] = [
    { name: 'Work', color: '#4285F4' },
    { name: 'Personal', color: '#34A853' },
    { name: 'Research', color: '#EA4335' },
    { name: 'Education', color: '#FBBC04' },
    { name: 'Legal', color: '#9C27B0' },
    { name: 'Finance', color: '#FF9800' },
    { name: 'Health', color: '#E91E63' },
    { name: 'Projects', color: '#00BCD4' }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading and processing document...');

    try {
      const fileList = event.target.files as FileList;
      
      // Get the selected category
      const category = selectedCategory === 'custom' ? customCategory.trim() : selectedCategory;
      
      // Create FormData to include category metadata
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('documents', fileList[i]);
      }
      
      if (category) {
        formData.append('category', category);
      }
      
      const response = await ragAPI.uploadDocumentsWithMetadata(fileList, { category });
      
      console.log('📤 Upload response:', response);
      console.log('📤 Response structure:', JSON.stringify(response, null, 2));
      
      // Handle the BaseController response structure
      const responseData = (response as any).data || response;
      const isSuccess = response.success;
      
      if (isSuccess) {
        const documentsCount = responseData.documents?.length || responseData.processedDocuments || responseData.totalChunks || 0;
        setUploadStatus(`Successfully processed ${documentsCount} document(s) from your upload!`);
        
        console.log('📤 Upload successful, calling onUploadSuccess callback...');
        onUploadSuccess();
        
        // Auto-close modal after successful upload
        setTimeout(() => {
          onClose();
          setUploadStatus('');
        }, 2000);
      } else {
        const errorMessage = response.message || responseData.message || 'Unknown error';
        setUploadStatus(`Upload failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Upload error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.status
      });
      
      // Try to extract meaningful error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Upload failed. Please try again.';
      setUploadStatus(errorMessage);
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGoogleDriveUpload = async () => {
    setIsUploading(true);
    setUploadStatus('Fetching documents from Google Drive...');

    try {
      // Get the selected category
      const category = selectedCategory === 'custom' ? customCategory.trim() : selectedCategory;
      
      // TODO: Add category support to Google Drive once backend implementation is complete
      const response = await ragAPI.loadFromGoogleDrive({});
      
      console.log('📤 Google Drive response:', response);
      console.log('📤 Google Drive response structure:', JSON.stringify(response, null, 2));
      
      // Handle the BaseController response structure  
      const responseData = (response as any).data || response;
      const isSuccess = response.success;
      
      if (isSuccess) {
        const documentsCount = responseData.documents?.length || responseData.processedDocuments || 0;
        setUploadStatus(`Successfully processed ${documentsCount} documents from Google Drive!`);
        
        console.log('📤 Google Drive upload successful, calling onUploadSuccess callback...');
        onUploadSuccess();
        
        // Auto-close modal after successful upload
        setTimeout(() => {
          onClose();
          setUploadStatus('');
        }, 2000);
      } else {
        const errorMessage = response.message || responseData.message || 'Unknown error';
        setUploadStatus(`Google Drive upload failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Google Drive upload error:', error);
      console.error('Google Drive error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.status
      });
      
      // Try to extract meaningful error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Google Drive upload failed. Please try again.';
      setUploadStatus(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setUploadStatus('');
      setSelectedCategory('');
      setCustomCategory('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Documents">
      <div className="upload-modal-content">
        <div className="upload-option">
          <h4>Upload Local Document</h4>
          <p>Upload PDF, TXT, DOC, or DOCX files to search through them.</p>
          
          {/* Category Selection */}
          <div className="category-section">
            <label htmlFor="category-select">Category (Optional):</label>
            <div className="category-selection">
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isUploading}
                className="category-select"
              >
                <option value="">Select a category...</option>
                {predefinedCategories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
                <option value="custom">+ Create New Category</option>
              </select>
              
              {selectedCategory === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter new category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  disabled={isUploading}
                  className="custom-category-input"
                />
              )}
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="file-input"
          />
        </div>

        <div className="upload-divider">
          <span>OR</span>
        </div>

        <div className="upload-option">
          <h4>Import from Google Drive</h4>
          <p>Fetch documents from your Google Drive to search through them.</p>
          
          {/* Same category selection for Google Drive */}
          <div className="category-section">
            <label htmlFor="gdrive-category-select">Category (Optional):</label>
            <div className="category-selection">
              <select
                id="gdrive-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isUploading}
                className="category-select"
              >
                <option value="">Select a category...</option>
                {predefinedCategories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
                <option value="custom">+ Create New Category</option>
              </select>
              
              {selectedCategory === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter new category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  disabled={isUploading}
                  className="custom-category-input"
                />
              )}
            </div>
          </div>
          
          <button
            onClick={handleGoogleDriveUpload}
            disabled={isUploading}
            className="google-drive-btn"
          >
            {isUploading ? 'Processing...' : 'Import from Google Drive'}
          </button>
        </div>

        {uploadStatus && (
          <div className={`upload-status ${isUploading ? 'uploading' : 'completed'}`}>
            {uploadStatus}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DocumentUploadModal;