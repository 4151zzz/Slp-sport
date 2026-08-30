import React from 'react';
import { Sparkles, Code2, Heart, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="elite-footer">
      <div className="footer-gradient-line" />
      <div className="elite-footer-container">
        {/* Left: School Identity */}
        <div className="footer-brand-side">
          <div className="footer-crest-wrapper">
            <img 
              src="/logo.png" 
              alt="ตราโรงเรียนสระหลวงพิทยาคม" 
              className="footer-crest-img"
            />
            <div className="crest-halo-glow" />
          </div>
          <div className="footer-titles">
            <div className="footer-school-title">
              โรงเรียนสระหลวงพิทยาคม
            </div>
            <div className="footer-sys-name">
              ระบบบริการยืม-คืนอุปกรณ์กีฬาเพื่อการศึกษาและกิจกรรม
            </div>
            <div className="footer-badge-row">
              <span className="footer-status-tag">
                <span className="status-ping" />
                พร้อมให้บริการยืม-คืน
              </span>
            </div>
          </div>
        </div>

        {/* Right: Modern Premium Developer Credit (Clickable Link) */}
        <div className="footer-credit-side">
          <a 
            href="https://www.facebook.com/wun.piyapong.XII?locale=th_TH"
            target="_blank"
            rel="noopener noreferrer"
            className="developer-signature-card"
            title="คลิกเพื่อเยี่ยมชม Facebook ของ wunPiyapong"
          >
            <div className="dev-card-accent-bar" />
            <div className="dev-card-body">
              <div className="dev-avatar-box">
                <Code2 size={18} className="dev-code-icon" />
              </div>
              <div className="dev-details">
                <div className="dev-label-row">
                  <span className="dev-lead">ออกแบบและพัฒนาโดย</span>
                  <span className="dev-version-pill">v2.0</span>
                </div>
                <div className="dev-name-row">
                  <span className="dev-name-highlight">wunPiyapong</span>
                  <span className="dev-verified-badge" title="Verified Developer">
                    <Sparkles size={13} className="sparkle-icon" />
                  </span>
                </div>
                <div className="dev-subtext">
                  ระบบยืมอุปกรณ์กีฬา • โรงเรียนสระหลวงพิทยาคม
                </div>
              </div>
            </div>
          </a>
          <div className="footer-copyright-text">
            © {new Date().getFullYear()} โรงเรียนสระหลวงพิทยาคม • สงวนลิขสิทธิ์
          </div>
        </div>
      </div>
    </footer>
  );
}
