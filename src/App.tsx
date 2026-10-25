export default function App() {
  return (
    <>
      <style>{`
        .cyber-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 36px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #fff;
          border: 1px solid rgba(6, 182, 212, 0.4);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.25), inset 0 0 15px rgba(168, 85, 247, 0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cyber-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.3), transparent);
          transition: left 0.5s ease;
          pointer-events: none;
        }
        .cyber-btn:hover::before { left: 100%; }
        .cyber-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #06b6d4;
          box-shadow: 0 0 10px #06b6d4;
          animation: pulse 0.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.85); }
        }
      `}</style>
    <div className="w-screen h-screen overflow-hidden bg-slate-950">
      <a
  href="https://www.flowmusic.app/space/1eb1e66e-c3d8-4a1c-a807-debde8a3c9a2"
  target="_blank"
  rel="noopener noreferrer"
  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold rounded-2xl group bg-linear-to-br from-cyan-400 via-violet-600 to-pink-500 hover:from-cyan-300 hover:to-pink-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
>
  <span className="relative px-7 py-3.5 transition-all ease-out bg-slate-950 rounded-[14px] group-hover:bg-opacity-0 flex items-center gap-3 text-white tracking-wider uppercase text-xs">
    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
    Initialize VoiceClone Studio
    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">→</span>
  </span>
</a>
    </div>
    </>
  );
}