/**
 * File Download Utilities
 */

/**
 * Validate and fix PDF link if it's a backend URL
 * Converts backend URL to frontend URL for sharing
 * @param url - URL that might be backend or frontend
 * @returns Frontend URL for sharing
 */
export const ensureFrontendUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a backend URL (contains /public/bill/)
    if (urlObj.pathname.includes('/public/bill/')) {
      // Extract token from backend URL
      const token = urlObj.pathname.split('/public/bill/')[1];
      if (token) {
        // Use current window origin as frontend URL
        const frontendUrl = `${window.location.origin}/bill/${token}`;
        console.warn('⚠️ Backend URL detected in pdfLink, converting to frontend URL:', {
          original: url,
          converted: frontendUrl
        });
        return frontendUrl;
      }
    }
    
    // Check if it's using backend domain (contains backend URL from env)
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5004/api";
    const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    if (urlObj.origin === new URL(backendBaseUrl).origin && urlObj.pathname.includes('/bill/')) {
      // Extract token
      const token = urlObj.pathname.split('/bill/')[1];
      if (token) {
        const frontendUrl = `${window.location.origin}/bill/${token}`;
        console.warn('⚠️ Backend domain detected in pdfLink, converting to frontend URL:', {
          original: url,
          converted: frontendUrl
        });
        return frontendUrl;
      }
    }
    
    // Already a frontend URL or valid URL
    return url;
  } catch (error) {
    console.error('Error validating PDF link:', error);
    return url;
  }
};

/**
 * Extract token from frontend bill URL and construct backend PDF URL
 * @param frontendUrl - Frontend URL like "https://festivalspark.netlify.app/bill/token123"
 * @returns Backend PDF URL like "https://backend.onrender.com/public/bill/token123"
 */
export const getBackendPDFUrl = (frontendUrl: string): string => {
  try {
    // Extract token from frontend URL (format: /bill/{token})
    const urlObj = new URL(frontendUrl);
    const pathParts = urlObj.pathname.split('/');
    const tokenIndex = pathParts.indexOf('bill');
    
    if (tokenIndex === -1 || tokenIndex === pathParts.length - 1) {
      // If no token found, return original URL
      return frontendUrl;
    }
    
    const token = pathParts[tokenIndex + 1];
    
    // Get backend URL from environment
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5004/api";
    // Remove /api suffix to get base backend URL
    const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    
    // Construct backend PDF URL
    return `${backendBaseUrl}/public/bill/${token}`;
  } catch (error) {
    console.error('Error constructing backend PDF URL:', error);
    // Fallback: return original URL
    return frontendUrl;
  }
};

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

          // Check if response is actually a PDF (not HTML)
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            throw new Error('Received HTML instead of PDF. This might be a redirect issue.');
          }

          const blob = await response.blob();
          
          // Double-check blob type
          if (blob.type && blob.type.includes('text/html')) {
            throw new Error('Blob is HTML, not PDF. Check the URL.');
          }

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

