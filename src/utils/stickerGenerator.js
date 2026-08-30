import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { downloadCanvasImage } from './fileDownloader';

/**
 * Generates a high-resolution, crisp PNG sticker card directly onto a 2D Canvas
 * without relying on DOM capture, guaranteeing 100% reliability on all platforms.
 */
export async function downloadStickerDirect(item, options = {}) {
  const {
    tagSize = 'medium',
    tagTheme = 'white',
    showBarcode = true,
    showQr = true,
    showLocation = true
  } = options;

  // High DPI dimensions
  const scale = 3;
  let baseWidth = tagSize === 'small' ? 260 : (tagSize === 'large' ? 360 : 300);
  let baseHeight = tagSize === 'small' ? 140 : (tagSize === 'large' ? 200 : 165);

  if (!showBarcode) baseHeight -= 35;
  if (!showQr) baseWidth -= 30;

  const width = baseWidth * scale;
  const height = baseHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  const isDark = tagTheme === 'dark';
  const isCyan = tagTheme === 'cyan';

  ctx.fillStyle = isDark ? '#1e293b' : (isCyan ? '#f0fdfa' : '#ffffff');
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = isDark ? '#38bdf8' : (isCyan ? '#0d9488' : '#0284c7');
  ctx.strokeRect(4 * scale, 4 * scale, width - 8 * scale, height - 8 * scale);

  // Header Bar
  ctx.fillStyle = isDark ? '#334155' : (isCyan ? '#ccfbf1' : '#f0f9ff');
  ctx.fillRect(6 * scale, 6 * scale, width - 12 * scale, 22 * scale);

  ctx.font = `bold ${8 * scale}px "Outfit", sans-serif`;
  ctx.fillStyle = isDark ? '#38bdf8' : (isCyan ? '#0d9488' : '#0284c7');
  ctx.textAlign = 'left';
  ctx.fillText('SPORTEQUIP INVENTORY', 12 * scale, 20 * scale);

  ctx.font = `bold ${8 * scale}px monospace`;
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText(item.id || '', width - 12 * scale, 20 * scale);

  // QR Code Rendering (left side)
  let contentLeft = 14 * scale;
  const qrPixelSize = (tagSize === 'small' ? 55 : (tagSize === 'large' ? 80 : 65)) * scale;

  if (showQr) {
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, item.code || item.id, {
      width: qrPixelSize,
      margin: 1,
      color: {
        dark: isDark ? '#f8fafc' : '#0f172a',
        light: isDark ? '#1e293b' : '#ffffff'
      }
    });
    ctx.drawImage(qrCanvas, 14 * scale, 34 * scale, qrPixelSize, qrPixelSize);
    contentLeft += qrPixelSize + (10 * scale);
  }

  // Text Content (right side of QR)
  const textX = contentLeft;
  ctx.textAlign = 'left';

  // Item Emoji + Name
  ctx.font = `bold ${12 * scale}px "Sarabun", "Outfit", sans-serif`;
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  
  const itemName = `${item.image ? item.image + ' ' : ''}${item.name || ''}`;
  // Text truncation if too long
  let displayTitle = itemName;
  if (displayTitle.length > 25) {
    displayTitle = displayTitle.slice(0, 24) + '...';
  }
  ctx.fillText(displayTitle, textX, 48 * scale);

  // Category
  ctx.font = `${8.5 * scale}px "Sarabun", "Outfit", sans-serif`;
  ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
  ctx.fillText(`หมวด: ${item.category || '-'}`, textX, 65 * scale);

  // Location
  if (showLocation) {
    ctx.font = `${8 * scale}px "Sarabun", "Outfit", sans-serif`;
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText(`จุดเก็บ: ${item.location || 'ห้องพัสดุ'}`, textX, 80 * scale);
  }

  // Barcode (Bottom)
  if (showBarcode) {
    const barcodeCanvas = document.createElement('canvas');
    try {
      JsBarcode(barcodeCanvas, item.code || item.id, {
        format: 'CODE128',
        width: 2 * scale,
        height: 28 * scale,
        displayValue: true,
        fontSize: 9 * scale,
        font: 'Outfit, Sarabun, sans-serif',
        margin: 2,
        background: isDark ? '#1e293b' : '#ffffff',
        lineColor: isDark ? '#f8fafc' : '#0f172a'
      });

      const barcodeY = height - (38 * scale);
      const barcodeWidth = Math.min(barcodeCanvas.width, width - (24 * scale));
      const barcodeX = (width - barcodeWidth) / 2;
      ctx.drawImage(barcodeCanvas, barcodeX, barcodeY, barcodeWidth, 34 * scale);
    } catch (e) {
      console.warn('Direct barcode render error:', e);
    }
  }

  // Save to file
  const safeCode = (item.code || item.id || 'EQUIP').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Sticker_${safeCode}.png`;
  const dataUrl = downloadCanvasImage(canvas, filename);

  return {
    success: !!dataUrl,
    dataUrl,
    filename,
    canvas
  };
}
