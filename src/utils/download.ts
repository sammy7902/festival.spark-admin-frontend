/**
 * File Download Utilities
 */

/**
 * Download a file from a URL
 * Handles CORS and redirects properly
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    // For external URLs or URLs that might have CORS issues, open in new tab
    // This allows the browser to handle CORS and redirects naturally
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Check if it's a same-origin request
      const urlObj = new URL(url);
      const currentOrigin = window.location.origin;
      
      // If same origin or we can't determine, try fetch first
      if (urlObj.origin === currentOrigin || url.includes('localhost') || url.includes('127.0.0.1')) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
          }

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.URL.revokeObjectURL(blobUrl);
          return;
        } catch (fetchError) {
          console.warn('Fetch failed, trying direct download:', fetchError);
          // Fall through to direct download method
        }
      }
      
      // For external URLs or when fetch fails, open in new tab
      // This is the most reliable method for PDFs with CORS/redirects
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Also try to trigger download if possible
      setTimeout(() => {
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }, 100);
    } else {
      // Relative URL - use standard fetch
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('Download error:', error);
    // As a last resort, try opening in new tab
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (openError) {
      console.error('Failed to open URL:', openError);
      throw error;
    }
  }
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};

