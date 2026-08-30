import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, ArrowLeftRight, Keyboard, Check, AlertCircle } from 'lucide-react';
import { playScanSound } from '../utils/barcodeAudio';

export default function ScannerModal() {
  const { scannerConfig, closeScanner } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentFacingMode, setCurrentFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!scannerConfig.isOpen) {
      cleanupScanner();
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setCameraError(null);

    // Wait for DOM to render #scanner-video-region
    const timer = setTimeout(async () => {
      if (isCancelled) return;
      await initAndStartCamera(currentFacingMode);
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [scannerConfig.isOpen, currentFacingMode]);

  const cleanupScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Scanner cleanup warning:', e);
      }
      html5QrCodeRef.current = null;
      setIsScanning(false);
    }
  };

  const initAndStartCamera = async (facingMode) => {
    try {
      setCameraError(null);
      setIsLoading(true);

      const region = document.getElementById('scanner-video-region');
      if (!region) {
        setIsLoading(false);
        return;
      }

      await cleanupScanner();

      const html5QrCode = new Html5Qrcode('scanner-video-region');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.floor(minEdge * 0.75);
          return { width: edgeSize, height: edgeSize };
        },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A
        ]
      };

      // Try camera with facingMode (best for mobile devices)
      try {
        await html5QrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            handleSuccess(decodedText);
          },
          () => {} // ignore frame decoding failures
        );
        setIsScanning(true);
        setIsLoading(false);
      } catch (startErr) {
        console.warn('FacingMode start failed, trying getCameras fallback:', startErr);
        // Fallback to getCameras if facingMode is not supported on this browser
        const devices = await Html5Qrcode.getCameras().catch(() => []);
        if (devices && devices.length > 0) {
          setCameras(devices);
          await html5QrCode.start(
            devices[0].id,
            config,
            (decodedText) => {
              handleSuccess(decodedText);
            },
            () => {}
          );
          setIsScanning(true);
          setIsLoading(false);
        } else {
          throw startErr;
        }
      }
    } catch (err) {
      console.error('Camera startup error:', err);
      setIsLoading(false);
      setIsScanning(false);
      setCameraError('ไม่สามารถเปิดกล้องได้ กรุณากดอนุญาต (Allow) การใช้กล้องในเบราว์เซอร์ หรือพิมพ์รหัสด้านล่าง');
    }
  };

  const handleSuccess = (code) => {
    playScanSound('success');
    cleanupScanner();
    if (scannerConfig.onScan) {
      scannerConfig.onScan(code);
    }
    closeScanner();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  const switchCameraFacing = () => {
    setCurrentFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!scannerConfig.isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={closeScanner} style={{ zIndex: 9999 }}>
      <div className="modal-dialog animate-pop-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '22px' }}>
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '14px' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 800 }}>
            <Camera size={20} color="#0284c7" />
            <span>{scannerConfig.title}</span>
          </div>
          <button className="modal-close-btn" onClick={closeScanner} style={{ background: '#f1f5f9', borderRadius: '50%', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Camera Viewport */}
        <div style={{ position: 'relative', marginBottom: '16px', borderRadius: '18px', overflow: 'hidden', minHeight: '260px', background: '#0f172a' }}>
          <div id="scanner-video-region" style={{ width: '100%', minHeight: '260px' }}></div>
          
          {isScanning && <div className="scanner-laser"></div>}

          {isLoading && !cameraError && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0f172a',
              color: '#38bdf8',
              gap: '10px'
            }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid rgba(56,189,248,0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>กำลังเชื่อมต่อกล้อง...</span>
            </div>
          )}
          
          {cameraError && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.96)',
              color: '#fca5a5'
            }}>
              <AlertCircle size={36} color="#ef4444" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.3 }}>{cameraError}</p>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                คุณสามารถพิมพ์รหัสอุปกรณ์หรือยิงบาร์โค้ดในช่องด้านล่างได้ทันที
              </p>
            </div>
          )}
        </div>

        {/* Switch Camera Button (Mobile) */}
        {!cameraError && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={switchCameraFacing} 
              style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeftRight size={14} />
              <span>สลับกล้อง ({currentFacingMode === 'environment' ? 'กล้องหลัง' : 'กล้องหน้า'})</span>
            </button>
          </div>
        )}

        {/* Manual Code Input Fallback */}
        <form onSubmit={handleManualSubmit}>
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
              <Keyboard size={15} color="#0284c7" />
              <span>หรือพิมพ์รหัส Barcode / รหัสอุปกรณ์</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น SP-FB-01 หรือ SP-BB-01"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                style={{ fontSize: '0.92rem', background: '#f8fafc' }}
                autoFocus
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0 18px', flexShrink: 0, borderRadius: '12px' }}
              >
                <Check size={18} />
              </button>
            </div>
          </div>
        </form>

        <div style={{ fontSize: '0.76rem', color: '#64748b', textAlign: 'center', marginTop: '6px' }}>
          💡 รองรับ QR Code, บาร์โค้ดทุกชนิด และเครื่องยิงบาร์โค้ด
        </div>
      </div>
    </div>
  );
}
