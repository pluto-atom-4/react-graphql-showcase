/**
 * useUploadFile hook tests
 */

/* global global */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUploadFile } from '../useUploadFile';

interface MockXHR {
  upload: { addEventListener: ReturnType<typeof vi.fn> };
  open: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  timeout: number;
  onload: (() => void) | null;
  onerror?: (() => void) | null;
  onabort?: (() => void) | null;
  ontimeout?: (() => void) | null;
  status?: number;
  responseText?: string;
}

describe('useUploadFile Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false and no error', () => {
    const { result } = renderHook(() => useUploadFile());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should have uploadFile function', () => {
    const { result } = renderHook(() => useUploadFile());
    expect(result.current.uploadFile).toBeDefined();
    expect(typeof result.current.uploadFile).toBe('function');
  });

  it('should accept formData, abortController, and progress callback', () => {
    const mockXhr: MockXHR = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(function (this: MockXHR) {
        this.status = 200;
        this.responseText = JSON.stringify({
          fileId: 'test-123',
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/files/test-123',
          uploadedAt: new Date().toISOString(),
        });
        setTimeout(() => this.onload?.());
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());

    expect(result.current.uploadFile).toBeDefined();
  });

  it('should return a promise', () => {
    const mockXhr: MockXHR = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    const uploadPromise = result.current.uploadFile(formData, abortController);
    expect(uploadPromise).toBeInstanceOf(Promise);
  });

  it('should call XMLHttpRequest open and send', async () => {
    const mockXhr: MockXHR = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(function (this: MockXHR) {
        this.status = 200;
        this.responseText = JSON.stringify({
          fileId: 'test-123',
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/files/test-123',
          uploadedAt: new Date().toISOString(),
        });
        setTimeout(() => this.onload?.());
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    // Just verify the function exists and can be called
    await result.current.uploadFile(formData, abortController).then(() => {
      expect(mockXhr.open).toHaveBeenCalled();
      expect(mockXhr.send).toHaveBeenCalled();
    });
  });

  it('should handle abort signal', () => {
    const mockXhr: MockXHR = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn((event: string) => {
        if (event === 'abort') {
          // Setup abort listener
        }
      }),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    const uploadPromise = result.current.uploadFile(formData, abortController);
    expect(uploadPromise).toBeInstanceOf(Promise);
  });

  it('should track progress', async () => {
    const progressCallback = vi.fn();

    // Create mock ProgressEvent with proper properties
    const mockProgressEvent = {
      lengthComputable: true,
      loaded: 512,
      total: 1024,
      type: 'progress',
    } as unknown as ProgressEvent;

    const mockXhr: MockXHR = {
      upload: {
        addEventListener: vi.fn((event: string, handler: (e?: ProgressEvent | Event) => void) => {
          if (event === 'progress') {
            // Simulate progress event asynchronously
            setTimeout(() => {
              handler(mockProgressEvent);
            }, 0);
          }
        }),
      },
      open: vi.fn(),
      send: vi.fn(function (this: MockXHR) {
        // Simulate upload completion
        setTimeout(() => {
          this.status = 200;
          this.responseText = JSON.stringify({
            fileId: 'test-123',
            fileName: 'test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            fileUrl: '/files/test-123',
            uploadedAt: new Date().toISOString(),
          });
          this.onload?.();
        }, 10);
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    // Start upload and wait for completion
    await result.current.uploadFile(formData, abortController, progressCallback);

    // Verify callback was invoked with correct progress
    expect(progressCallback).toHaveBeenCalled();
    expect(progressCallback).toHaveBeenCalledWith({
      loaded: 512,
      total: 1024,
      percentage: 50,
    });

    // Cleanup
    delete (global as Record<string, unknown>).XMLHttpRequest;
  });

  it('should handle undefined ProgressEvent gracefully', async () => {
    const progressCallback = vi.fn();
    
    const mockXhr: MockXHR = {
      upload: {
        addEventListener: vi.fn((event: string, handler: (e?: ProgressEvent | Event) => void) => {
          if (event === 'progress') {
            setTimeout(() => {
              handler(undefined);
            }, 0);
          }
        }),
      },
      open: vi.fn(),
      send: vi.fn(function (this: MockXHR) {
        this.status = 200;
        this.responseText = JSON.stringify({
          fileId: 'test-123',
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/files/test-123',
          uploadedAt: new Date().toISOString(),
        });
        setTimeout(() => this.onload?.());
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    await result.current.uploadFile(formData, abortController, progressCallback);

    // Progress callback should not be called when event is undefined
    expect(progressCallback).not.toHaveBeenCalled();

    // Cleanup
    delete (global as Record<string, unknown>).XMLHttpRequest;
  });

  it('should handle event without lengthComputable property', async () => {
    const progressCallback = vi.fn();

    // Event without lengthComputable property
    const incompleteEvent = { loaded: 100, total: 200 } as unknown as ProgressEvent;

    const mockXhr: MockXHR = {
      upload: {
        addEventListener: vi.fn((event: string, handler: (e?: ProgressEvent | Event) => void) => {
          if (event === 'progress') {
            setTimeout(() => {
              handler(incompleteEvent);
            }, 0);
          }
        }),
      },
      open: vi.fn(),
      send: vi.fn(function (this: MockXHR) {
        this.status = 200;
        this.responseText = JSON.stringify({
          fileId: 'test-123',
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/files/test-123',
          uploadedAt: new Date().toISOString(),
        });
        setTimeout(() => this.onload?.());
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    await result.current.uploadFile(formData, abortController, progressCallback);
    
    // Progress callback should not be called when lengthComputable is missing
    expect(progressCallback).not.toHaveBeenCalled();
    
    // Cleanup
    delete (global as Record<string, unknown>).XMLHttpRequest;
  });

  it('should handle event with lengthComputable false', async () => {
    const progressCallback = vi.fn();
    
    // Event with lengthComputable set to false
    const eventWithoutLength = {
      lengthComputable: false,
      loaded: 100,
      total: 200,
      type: 'progress',
    } as unknown as ProgressEvent;

    const mockXhr: MockXHR = {
      upload: {
        addEventListener: vi.fn((event: string, handler: (e?: ProgressEvent | Event) => void) => {
          if (event === 'progress') {
            setTimeout(() => {
              handler(eventWithoutLength);
            }, 0);
          }
        }),
      },
      open: vi.fn(),
      send: vi.fn(function (this: MockXHR) {
        this.status = 200;
        this.responseText = JSON.stringify({
          fileId: 'test-123',
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/files/test-123',
          uploadedAt: new Date().toISOString(),
        });
        setTimeout(() => this.onload?.());
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    await result.current.uploadFile(formData, abortController, progressCallback);

    // Progress callback should not be called when lengthComputable is false
    expect(progressCallback).not.toHaveBeenCalled();

    // Cleanup
    delete (global as Record<string, unknown>).XMLHttpRequest;
  });

  it('should calculate correct percentage for various progress values', async () => {
    const progressCallback = vi.fn();

    // Event with specific progress value
    const progressEvent = {
      lengthComputable: true,
      loaded: 250,
      total: 1000,
      type: 'progress',
    } as unknown as ProgressEvent;

    const mockXhr: MockXHR = {
      upload: {
        addEventListener: vi.fn((event: string, handler: (e?: ProgressEvent | Event) => void) => {
          if (event === 'progress') {
            setTimeout(() => {
              handler(progressEvent);
            }, 0);
          }
        }),
      },
      open: vi.fn(),
      send: vi.fn(function (this: MockXHR) {
        this.status = 200;
        this.responseText = JSON.stringify({
          fileId: 'test-123',
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/files/test-123',
          uploadedAt: new Date().toISOString(),
        });
        setTimeout(() => this.onload?.());
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(function () { return mockXhr; }) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    await result.current.uploadFile(formData, abortController, progressCallback);
    
    // Verify correct percentage is calculated (250/1000 = 25%)
    expect(progressCallback).toHaveBeenCalledWith({
      loaded: 250,
      total: 1000,
      percentage: 25,
    });
    
    // Cleanup
    delete (global as Record<string, unknown>).XMLHttpRequest;
  });
});
