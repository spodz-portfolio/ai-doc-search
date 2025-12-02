import React, { useState, useRef } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/feedback/LoadingSpinner';
import { ragAPI } from '../../../services/ragAPI';
import { useAppSelector } from '../../../app/store/store';
import styles from './DocumentUpload.module.css';

const DocumentUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [supportedFormats, setSupportedFormats] = useState<any>(null);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState('');
  const [googleDocsSearchQuery, setGoogleDocsSearchQuery] = useState('');
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ragStatus = useAppSelector(state => state.chat.ragStatus);

  React.useEffect(() => {
    loadSupportedFormats();
  }, []);

  const loadSupportedFormats = async () => {
    try {
      const formats = await ragAPI.getSupportedFormats();
      setSupportedFormats(formats);
    } catch (error) {
      console.error('Failed to load supported formats:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
    setUploadStatus('');
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadStatus('Uploading and processing files...');

    try {
      const result = await ragAPI.uploadDocuments(selectedFiles);
      
      if (result.success) {
        const totalChunks = result.documents?.reduce((sum, doc) => sum + doc.chunkCount, 0) || 0;
        setUploadStatus(`✅ Successfully uploaded ${selectedFiles.length} files and created ${totalChunks} chunks`);
        setSelectedFiles(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus(`❌ Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleDocsLoad = async () => {
    if (!googleDocsSearchQuery.trim()) return;

    setIsLoadingDocs(true);
    setUploadStatus('Loading Google Docs...');

    try {
      const result = await ragAPI.searchAndLoadGoogleDocs({
        searchQuery: googleDocsSearchQuery,
        maxDocs: 10,
      });

      if (result.success) {
        setUploadStatus(`✅ Successfully loaded ${result.documents?.length || 0} Google Docs`);
        setGoogleDocsSearchQuery('');
      } else {
        setUploadStatus(`❌ Failed to load Google Docs: ${result.message}`);
      }
    } catch (error) {
      console.error('Google Docs load error:', error);
      setUploadStatus(`❌ Failed to load Google Docs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleGoogleDriveLoad = async () => {
    if (!googleDriveFolderId.trim()) return;

    setIsLoadingDocs(true);
    setUploadStatus('Loading Google Drive folder...');

    try {
      const result = await ragAPI.loadFromGoogleDrive({
        folderId: googleDriveFolderId,
        maxDocs: 50,
      });

      if (result.success) {
        setUploadStatus(`✅ Successfully loaded ${result.documents?.length || 0} documents from Google Drive`);
        setGoogleDriveFolderId('');
      } else {
        setUploadStatus(`❌ Failed to load Google Drive: ${result.message}`);
      }
    } catch (error) {
      console.error('Google Drive load error:', error);
      setUploadStatus(`❌ Failed to load Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Document Management</h3>
      
      {ragStatus && (
        <div className={styles.status}>
          <div className={styles.statusItem}>
            <span>📄 Documents: {ragStatus.documentsLoaded || 0}</span>
          </div>
          <div className={styles.statusItem}>
            <span>🧩 Chunks: {ragStatus.totalChunks || 0}</span>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Upload Files</h4>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedFormats?.formats?.join(',') || '.pdf,.docx,.txt,.md'}
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
        
        {selectedFiles && selectedFiles.length > 0 && (
          <div className={styles.selectedFiles}>
            <p>Selected files: {selectedFiles.length}</p>
            <ul className={styles.fileList}>
              {Array.from(selectedFiles).map((file, index) => (
                <li key={index} className={styles.fileItem}>
                  {file.name} ({Math.round(file.size / 1024)}KB)
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <Button
          onClick={handleUpload}
          disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
          loading={isUploading}
          className={styles.uploadButton}
        >
          Upload & Process
        </Button>
      </div>

      {/* Google Docs Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Google Docs</h4>
        
        <input
          type="text"
          value={googleDocsSearchQuery}
          onChange={(e) => setGoogleDocsSearchQuery(e.target.value)}
          placeholder="Search Google Docs..."
          className={styles.input}
        />
        
        <Button
          onClick={handleGoogleDocsLoad}
          disabled={!googleDocsSearchQuery.trim() || isLoadingDocs}
          loading={isLoadingDocs}
          size="sm"
          className={styles.loadButton}
        >
          Load Google Docs
        </Button>
      </div>

      {/* Google Drive Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Google Drive</h4>
        
        <input
          type="text"
          value={googleDriveFolderId}
          onChange={(e) => setGoogleDriveFolderId(e.target.value)}
          placeholder="Google Drive Folder ID..."
          className={styles.input}
        />
        
        <Button
          onClick={handleGoogleDriveLoad}
          disabled={!googleDriveFolderId.trim() || isLoadingDocs}
          loading={isLoadingDocs}
          size="sm"
          className={styles.loadButton}
        >
          Load Drive Folder
        </Button>
      </div>

      {/* Status Display */}
      {uploadStatus && (
        <div className={styles.uploadStatus}>
          {(isUploading || isLoadingDocs) && (
            <LoadingSpinner size="sm" />
          )}
          <span>{uploadStatus}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;