/**
 * FileUploader Component Type Definitions
 * Provides TypeScript interfaces and types for file upload functionality.
 */

/** Error code types for file upload errors */
export type ErrorCode = 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'TOO_MANY_FILES' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'CANCELLED';

/** File upload status states */
export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'cancelled';

/**
 * Configuration object for FileUploader component
 */
export interface FileUploadConfig {
  /** Allowed MIME types (default: ['application/pdf', 'image/jpeg', 'image/png']) */
  acceptedTypes?: string[];
  /** Max file size in MB (default: 50) */
  maxSizeMB?: number;
  /** Max number of files for batch upload (default: 1) */
  maxFiles?: number;
  /** Callback on successful upload */
  onSuccess?: (files: UploadedFile[]) => void;
  /** Callback on error */
  onError?: (error: UploadError) => void;
  /** Callback for progress tracking (bytes uploaded, total bytes) */
  onProgress?: (progress: ProgressEvent) => void;
  /** Related entity ID (e.g., buildId) */
  entityId?: string;
  /** Upload destination (e.g., 'test-reports', 'cad-files') */
  destination?: string;
}

/**
 * Successfully uploaded file metadata
 */
export interface UploadedFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  uploadedAt: string;
}

/**
 * Upload error details
 */
export interface UploadError {
  code: ErrorCode;
  message: string;
  details?: string;
}

/**
 * Progress event during file upload
 */
export interface ProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * FileUploader component props
 */
export interface FileUploaderProps {
  config: FileUploadConfig;
  showPreview?: boolean;
  label?: string;
  disabled?: boolean;
  testId?: string;
}

/**
 * File validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: ErrorCode;
}

/**
 * Drop zone hook return type
 */
export interface DropZoneReturn {
  isDragActive: boolean;
  getRootProps: () => DropZoneRootProps;
  getInputProps: () => DropZoneInputProps;
}

/**
 * Root props for drop zone
 */
export interface DropZoneRootProps {
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Input props for drop zone
 */
export interface DropZoneInputProps {
  type: 'file';
  multiple: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
