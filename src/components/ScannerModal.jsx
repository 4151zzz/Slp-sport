import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Flashlight, ArrowLeftRight, Keyboard, Check } from 'lucide-react';
import { playScanSound } from '../utils/barcodeAudio';

export default function ScannerModal() {
  const { scannerConfig, closeScanner } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!scannerConfig.isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;

    async function initScanner() {
      try {
        setCameraError(null);
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          const targetCamId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(targetCamId);
          startCamera(targetCamId);
        } else {
          setCameraError('ไม่พบกล้องในอุปกรณ์นี้');
        }
      } catch (err) {
        console.error('Camera init error:', err);
        setCameraError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์การใช้กล้อง');
      }
    }

    initScanner();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [scannerConfig.isOpen]);

  const startCamera = async (cameraId) => {
    try {
      if (html5QrCodeRef.current) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode('scanner-video-region');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
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

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          handleSuccess(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      console.warn('Start camera failed:', err);
      setCameraError('เกิดข้อผิดพลาดในการเปิดกล้อง');
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Stop error:', e);
      }
      setIsScanning(false);
      html5QrCodeRef.current = null;
    }
  };

  const handleSuccess = (code) => {
    playScanSound('success');
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

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    setSelectedCameraId(nextCameraId);
    startCamera(nextCameraId);
  };

  if (!scannerConfig.isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={closeScanner}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Camera size={20} color="#38bdf8" />
            <span>{scannerConfig.title}</span>
          </div>
          <button className="modal-close-btn" onClick={closeScanner}>
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewport */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div id="scanner-video-region" className="scanner-viewport"></div>
          {isScanning && <div className="scanner-laser"></div>}
          
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
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#f87171',
              borderRadius: 'var(--radius-lg)'
            }}>
              <Camera size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{cameraError}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                สามารถพิมพ์รหัสอุปกรณ์หรือยิงด้วยเครื่องสแกนบาร์โค้ดด้านล่างได้ทันที
              </p>
            </div>
          )}
        </div>

        {/* Camera controls */}
        {cameras.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <button className="btn btn-secondary" onClick={switchCamera} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              <ArrowLeftRight size={16} />
              <span>สลับกล้อง ({cameras.find(c => c.id === selectedCameraId)?.label || 'กล้อง'})</span>
            </button>
          </div>
        )}

        {/* Manual Code Input Fallback */}
        <form onSubmit={handleManualSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Keyboard size={15} />
              <span>หรือพิมพ์รหัส Barcode / รหัสอุปกรณ์</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น FB-001001 หรือ EQ-1001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 18px', flexShrink: 0 }}>
                <Check size={18} />
              </button>
            </div>
          </div>
        </form>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
          💡 รองรับทั้ง QR Code, Code128, EAN13 และเครื่องยิงบาร์โค้ด USB/Bluetooth
        </div>
      </div>
    </div>
  );
}
