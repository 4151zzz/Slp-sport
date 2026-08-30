/**
 * Robust cross-browser file downloader utility for Windows / Chromium / Safari / Edge
 */

/**
 * Downloads an HTML5 Canvas as a PNG image file
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename - e.g. "Sticker_FB-001.png"
 * @returns {string} dataUrl of the image
 */
export function downloadCanvasImage(canvas, filename = 'image.png') {
  if (!canvas) return null;

  const finalName = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  try {
    // 1. Direct Anchor Download with Base64
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = dataUrl;
    link.download = finalName;
    link.setAttribute('download', finalName);
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 2000);
  } catch (err) {
    console.warn('Direct dataURL click error, trying blob fallback:', err);
    try {
      const byteString = atob(dataUrl.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/png' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = finalName;
      link.setAttribute('download', finalName);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 5000);
    } catch (e) {
      console.error('Blob download error:', e);
    }
  }

  return dataUrl;
}

/**
 * Copies a canvas image to clipboard if supported
 * @param {HTMLCanvasElement} canvas
 */
export async function copyCanvasToClipboard(canvas) {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) return false;
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } catch (e) {
          console.warn('Clipboard write error:', e);
          resolve(false);
        }
      }, 'image/png');
    });
  } catch {
    return false;
  }
}
