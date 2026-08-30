import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Zap, Shield, Flame, Activity } from 'lucide-react';

export default function LoadingScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const statusMessages = [
    { text: 'กำลังเชื่อมต่อระบบฐานข้อมูลพัสดุกีฬา...', icon: '⚡' },
    { text: 'โหลดรายการอุปกรณ์กีฬา โรงเรียนสระหลวงพิทยาคม...', icon: '🏆' },
    { text: 'ซิงค์สถานะการยืม-คืนและสถิติล่าสุด...', icon: '🔄' },
    { text: 'ปรับแต่งระบบความปลอดภัยและส่วนแสดงผล...', icon: '🛡️' },
    { text: 'ระบบพร้อมให้บริการแล้ว ยินดีต้อนรับ!', icon: '✨' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFading(true);
            setTimeout(() => {
              if (onFinish) onFinish();
            }, 650);
          }, 350);
          return 100;
        }

        const step = Math.floor(Math.random() * 8) + 4;
        const next = Math.min(prev + step, 100);

        // Update status text based on progress milestone
        if (next >= 85) setStatusIndex(4);
        else if (next >= 60) setStatusIndex(3);
        else if (next >= 35) setStatusIndex(2);
        else if (next >= 15) setStatusIndex(1);
        else setStatusIndex(0);

        return next;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className={`elite-loading-overlay ${isFading ? 'overlay-fadeout' : ''}`}>
      {/* Animated Aurora Background Mesh */}
      <div className="aurora-orb aurora-1" />
      <div className="aurora-orb aurora-2" />
      <div className="aurora-orb aurora-3" />
      <div className="aurora-grid-pattern" />

      {/* Floating 3D Sports Spheres & Particles */}
      <div className="elite-particles">
        <div className="sport-particle p-1"><span>⚽</span></div>
        <div className="sport-particle p-2"><span>🏀</span></div>
        <div className="sport-particle p-3"><span>🏸</span></div>
        <div className="sport-particle p-4"><span>🏐</span></div>
        <div className="sport-particle p-5"><span>🏓</span></div>
        <div className="sport-particle p-6"><span>🏃</span></div>
        <div className="spark-particle sp-1" />
        <div className="spark-particle sp-2" />
        <div className="spark-particle sp-3" />
        <div className="spark-particle sp-4" />
      </div>

      {/* Central Glass Morphism Hologram Card */}
      <div className="elite-loading-card">
        {/* Holographic Logo Showcase with Orbiting Rings */}
        <div className="elite-logo-stage">
          <div className="orbit-ring orbit-ring-outer" />
          <div className="orbit-ring orbit-ring-middle" />
          <div className="orbit-ring orbit-ring-inner">
            <div className="orbit-dot dot-1" />
            <div className="orbit-dot dot-2" />
          </div>

          <div className="logo-glow-halo" />
          
          <div className="elite-logo-frame">
            <img 
              src="/logo.png" 
              alt="ตราโรงเรียนสระหลวงพิทยาคม" 
              className="elite-logo-image"
            />
          </div>
        </div>

        {/* School & App Branding */}
        <div className="elite-text-container">
          <div className="school-pill-badge">
            <span className="pill-dot-pulse" />
            <Sparkles size={13} className="pill-sparkle" />
            <span>โรงเรียนสระหลวงพิทยาคม</span>
          </div>

          <h1 className="elite-app-title">
            ระบบยืมอุปกรณ์กีฬา
          </h1>
          <div className="elite-app-subtitle">
            SPORTS EQUIPMENT MANAGEMENT SYSTEM
          </div>
        </div>

        {/* Futuristic Energy Bar */}
        <div className="elite-progress-section">
          <div className="progress-top-info">
            <div className="status-live-ticker">
              <span className="ticker-icon">{statusMessages[statusIndex].icon}</span>
              <span className="ticker-text">{statusMessages[statusIndex].text}</span>
            </div>
            <div className="percent-counter">
              <span>{progress}</span>
              <span className="percent-unit">%</span>
            </div>
          </div>

          <div className="elite-progress-track">
            <div 
              className="elite-progress-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="fill-glow-head" />
              <div className="fill-laser-shimmer" />
            </div>
          </div>
        </div>

        {/* Developer Credit Footer Badge */}
        <div className="elite-credit-footer">
          <div className="credit-glow-pill">
            <Zap size={14} className="credit-zap-icon" />
            <span className="credit-text">พัฒนาโดย</span>
            <span className="credit-author">wunPiyapong</span>
            <span className="credit-flame">🔥</span>
          </div>
        </div>
      </div>
    </div>
  );
}
