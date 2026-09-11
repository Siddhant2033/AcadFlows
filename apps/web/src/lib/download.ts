import api from './api';

/**
 * Trigger a browser download for an authenticated API endpoint that
 * returns a file (CSV, PDF, etc.).
 */
export async function downloadFile(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  try {
    const response = await api.get(path, {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition if present
    let filename = fallbackFilename;
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = new Blob([response.data], {
      type:
        typeof response.headers['content-type'] === 'string'
          ? response.headers['content-type']
          : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}