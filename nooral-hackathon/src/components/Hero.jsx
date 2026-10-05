import { useEffect, useState } from "react";
import { EVENT } from "../config.js";

function useCountdown(target) {
  const calc = () => Math.max(new Date(target).getTime() - Date.now(), 0);
  const [ms, setMs] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(t);
  }, [target]);
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
    over: ms === 0,
  };
}

export default function Hero({ slots, onRegister }) {
  const c = useCountdown(EVENT.startsAt);
  const known = slots.remaining !== null;
  const full = known && slots.remaining <= 0;
  const filling = known && !full && slots.remaining <= slots.total / 2;

  const units = [
    ["Days", c.days],
    ["Hours", c.hours],
    ["Mins", c.mins],
    ["Secs", c.secs],
  ];

  return (
    <section className="hero">
      <div className="hero-copy">
        {/* Brand Header */}
        <div className="hero-brand-header">
          <div className="brand-logo-row">
            <img src="/nooral-globe-logo.png" alt="Nooral.AI Logo" className="brand-globe-icon" />
            <span className="brand-text">Nooral<span className="brand-ai">.Ai</span></span>
          </div>
          <div className="presents-divider">
            <span className="presents-line left"></span>
            <span>PRESENTS</span>
            <span className="presents-line right"></span>
          </div>
        </div>

        {/* Title */}
        <div className="main-title-wrap">
          <h1 className="hackverse-title">
            <span className="hack-text">Hack</span>
            <span className="verse-text">Verse</span>
          </h1>
          <svg className="orbit-ring" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="150" cy="50" rx="140" ry="38" stroke="url(#orbitGrad)" strokeWidth="2.5" strokeDasharray="6 4" transform="rotate(-6 150 50)" />
            <defs>
              <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ff007f" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Sub-heading */}
        <div className="hero-subtitle">
          <p className="nat-level">A NATIONAL LEVEL</p>
          <h2 className="hackathon-text">HACKATHON</h2>
        </div>

        {/* Date & Location Info Line */}
        <div className="hero-date-line">
          📅 {EVENT.dateLabel} · {EVENT.location}
        </div>

        {/* Tagline */}
        <div className="hero-tagline-bar">
          <span>Think</span>
          <span className="dot dot-cyan">•</span>
          <span>Build</span>
          <span className="dot dot-pink">•</span>
          <span>Create</span>
          <span className="dot dot-cyan">•</span>
          <span>Make an Impact</span>
        </div>

        <p className="lead">{EVENT.description}</p>

        <div className="cta">
          {full ? (
            <div className="closed-banner-box">
              <span className="closed-title">Registrations are closed.</span>
              <span className="closed-sub">For more information, please contact Nooral.AI.</span>
            </div>
          ) : (
            <button className="btn-primary" onClick={onRegister}>
              Register Now →
            </button>
          )}
          <a className="btn-outline" href="#details">
            ▷ Learn More
          </a>
        </div>
      </div>

      <div className="hero-right-side">
        {/* AI face profile background illustration */}
        <div className="ai-face-wrapper">
          <img src="/ai-face.jpg" alt="Cybernetic AI profile" className="ai-face-img" />
          <div className="ai-face-glow"></div>
        </div>

        {/* Live Slot & Countdown Card */}
        <aside className="slots-card" aria-label="Live slots and countdown">
          <div className="slots-head">🚀 LIVE SLOTS</div>
          <div className="slots-num">
            <span className="big">{known ? slots.remaining : "–"}</span>
            <span className="of">/{slots.total}</span>
          </div>
          <div className="slots-label">TEAMS REMAINING</div>
          <hr />
          <div className="starts">HACKATHON STARTS IN</div>
          <div className="countdown">
            {units.map(([label, v], i) => (
              <div key={label} className="cd-wrap">
                {i > 0 && <span className="dot">•</span>}
                <div className="cd">
                  <b>{c.over ? 0 : v}</b>
                  <small>{label}</small>
                </div>
              </div>
            ))}
          </div>
          {full ? (
            <div className="pill pill-red">Registrations closed</div>
          ) : filling ? (
            <div className="pill">⚡ Filling fast!</div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
