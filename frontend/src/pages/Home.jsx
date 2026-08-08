import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  MessageSquare, 
  Database, 
  Compass, 
  Activity, 
  Search, 
  Layers,
  Sparkles,
  Waves
} from 'lucide-react';

const PRESETS = [
  "Show temperature near India.",
  "Show salinity near the equator in March 2023.",
  "Show temperature changes over time.",
  "Show temperature versus depth.",
  "Show oxygen levels over time.",
  "Show ARGO float locations in the Indian Ocean."
];

const Home = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState({ floats: '...', profiles: '...', observations: '...' });
  const [isLiveDb, setIsLiveDb] = useState(false);
  const canvasRef = useRef(null);

  // Fetch actual statistics from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats({
            floats: data.counts.floats,
            profiles: data.counts.profiles,
            observations: data.counts.measurements
          });
          setIsLiveDb(true);
        }
      } catch (err) {
        // Fallback to offline defaults
        setStats({ floats: 3, profiles: 30, observations: 390 });
      }
    };
    fetchStats();
  }, []);

  // HTML5 Canvas interactive ocean data visualizer (wireframe globe grid, drift paths, particles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Handle resize
    const handleResize = () => {
      if (canvas) {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Particles and float markers
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.3 - 0.1,
      alpha: Math.random() * 0.5 + 0.1
    }));

    const argoFloats = [
      { x: width * 0.4, y: height * 0.4, label: "Float 5904620 (Bay of Bengal)", color: "#38bdf8", targetX: width * 0.55, targetY: height * 0.3, progress: 0 },
      { x: width * 0.5, y: height * 0.7, label: "Float 5904621 (Equator)", color: "#10b981", targetX: width * 0.75, targetY: height * 0.65, progress: 0 },
      { x: width * 0.25, y: height * 0.55, label: "Float 5904622 (Arabian Sea)", color: "#f59e0b", targetX: width * 0.15, targetY: height * 0.4, progress: 0 }
    ];

    const drawGridGlobe = (time) => {
      ctx.clearRect(0, 0, width, height);

      // Draw wireframe grid lines representing Lat/Lon Coordinate Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1.2;

      // Vertical longitude lines
      for (let i = 0; i < width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.bezierCurveTo(i - 20, height * 0.3, i + 20, height * 0.7, i, height);
        ctx.stroke();
      }

      // Horizontal latitude lines
      for (let j = 0; j < height; j += 50) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Draw subtle orbital ring (Ocean Current flow)
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, width * 0.35, height * 0.25, Math.sin(time / 2000) * 0.1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 15]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw drifting ocean particles
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.fill();
      });

      // Draw ARGO floats, drift lines, and popup details
      argoFloats.forEach((f, idx) => {
        f.progress += 0.001;
        if (f.progress > 1) f.progress = 0;

        // Current coordinates based on progress interpolation
        const currentX = f.x + (f.targetX - f.x) * f.progress;
        const currentY = f.y + (f.targetY - f.y) * f.progress;

        // Draw drift path (dashed line)
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.targetX, f.targetY);
        ctx.strokeStyle = `${f.color}25`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glow ring
        ctx.beginPath();
        ctx.arc(currentX, currentY, 12 + Math.sin(time / 200) * 4, 0, Math.PI * 2);
        ctx.fillStyle = `${f.color}15`;
        ctx.fill();

        // Core marker
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Draw tiny label overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        
        const labelWidth = ctx.measureText(f.label).width + 16;
        ctx.beginPath();
        ctx.roundRect(currentX + 12, currentY - 10, labelWidth, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(f.label, currentX + 20, currentY + 2);
      });
    };

    const animate = (time) => {
      drawGridGlobe(time);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onNavigate('explore', query.trim());
    }
  };

  return (
    <div className="flex flex-col gap-14 py-6 max-w-6xl mx-auto w-full">
      
      {/* Hero & Interactive Globe Grid Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-4">
        
        {/* Left Side: Copywriting */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-bold uppercase tracking-widest w-fit">
            <Waves className="h-4 w-4 text-sky-400 animate-pulse" />
            <span>AI Ocean Exploration Hub</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight leading-[1.08] text-slate-100">
            Talk to the <br />
            <span className="bg-gradient-to-r from-sky-400 via-sky-200 to-indigo-400 bg-clip-text text-transparent">
              Ocean.
            </span>
          </h1>

          <h2 className="font-display font-bold text-lg sm:text-xl text-slate-300">
            Explore complex ARGO ocean data through natural-language conversations.
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
            FloatChat transforms scientific ocean observations into interactive maps, 
            charts, and understandable insights. Designed for researchers, policymakers, 
            students, and environmental organizations.
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <button
              onClick={() => onNavigate('explore')}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-sky-500/15 hover:shadow-sky-500/30 transition-all hover:scale-[1.02]"
              id="start-exploring-hero"
            >
              <span>Start Exploring</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('explore', PRESETS[0])}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold text-sm px-6 py-3.5 rounded-xl border border-slate-800/80 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Compass className="h-4.5 w-4.5 text-indigo-400" />
              <span>Try Demo</span>
            </button>
          </div>
        </div>

        {/* Right Side: Interactive Globe Visualizer */}
        <div className="lg:col-span-5 h-[340px] sm:h-[380px] rounded-3xl overflow-hidden glass border border-slate-800/60 shadow-2xl relative flex items-center justify-center bg-gradient-to-b from-slate-950/40 to-slate-950/80">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 select-none">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-sky-400 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> telemetry telemetry trajectories
            </span>
            <span className="text-[9px] text-slate-500">Live coordinates drift mapping simulator</span>
          </div>
        </div>

      </section>

      {/* Metrics Strips */}
      <section className="glass-card p-6 rounded-2xl border border-slate-850/80 shadow-md">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-900 justify-between text-xs">
          <span className="font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Database className="h-4 w-4 text-sky-400" />
            Operational Statistics Strip
          </span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            {isLiveDb ? "Live Database Sync" : "Sample Demo Mode Data"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-800/40">
          {[
            { label: "ARGO Floats", value: stats.floats, desc: "Active spatial platforms" },
            { label: "Ocean Profiles", value: stats.profiles, desc: "Total temporal profile runs" },
            { label: "Observations", value: stats.observations, desc: "Valid physical parameter levels" },
            { label: "Parameters", value: 4, desc: "Temp, Salinity, Oxygen, Depth" }
          ].map((s, idx) => (
            <div key={idx} className="flex flex-col gap-1 first:pl-0 pl-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display tracking-tight">{s.value}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
              <span className="text-[9px] text-slate-500 mt-0.5">{s.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* "Ask the Ocean" Interaction Area */}
      <section className="max-w-4xl mx-auto w-full text-center flex flex-col gap-6 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-100">Ask the Ocean Anything</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Ask questions about temperature, salinity, oxygen, depth, time or location in natural language.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-4.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about temperature, salinity, oxygen, depth or location..."
              className="w-full bg-slate-950/80 hover:bg-slate-950 focus:bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-sky-500/80 text-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition-colors shadow-inner"
              id="home-query-input"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="px-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 disabled:opacity-40 disabled:scale-100 active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/15"
            id="home-query-submit"
          >
            <span>Ask AI</span>
            <MessageSquare className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Questions Tags */}
        <div className="flex flex-col gap-3 mt-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-center">
            <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
            Example Queries
          </span>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate('explore', p)}
                className="text-[11px] bg-slate-900/60 hover:bg-slate-900 text-slate-350 border border-slate-800/85 hover:border-sky-500/30 px-3.5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:text-sky-400 active:scale-95 shadow-sm"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
