import React from 'react';
import { 
  Database, 
  Layers, 
  Cpu, 
  Compass, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

const HowItWorks = () => {
  return (
    <div className="flex flex-col gap-8 py-4 max-w-6xl mx-auto w-full">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl text-slate-100">Workflow & Architecture</h1>
        <p className="text-xs text-slate-400">Detailed stepper systems displaying the data ingestion and SQL queries pipeline blueprints</p>
      </div>

      {/* 1. DATA PIPELINE CARDS */}
      <section className="glass-card p-6 rounded-2xl flex flex-col gap-6">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900 justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5.5 w-5.5 text-sky-400" />
            <h3 className="font-display font-bold text-base text-slate-100">01. Back-end Data Ingestion Pipeline</h3>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            Scheduled / Synchronous
          </span>
        </div>
        
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          Physical float telemetry is collected in binary formats. The ingestion pipeline reads, sanitizes, and indexes these packages into Postgres.
        </p>

        {/* Pipeline Stepper Graph */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
          {[
            { step: "01", icon: Compass, name: "ARGO NetCDF", desc: "Retrieves profile files (.nc format) from Global Data Assembly Centres (GDACs)." },
            { step: "02", icon: Layers, name: "xarray/netCDF4", desc: "Memory-maps binary NetCDF variables into structured datasets using Pandas." },
            { step: "03", icon: Activity, name: "Sensor Cleaning", desc: "Standardizes time vectors and coordinate floats. Discards empty measurements layers." },
            { step: "04", icon: ShieldCheck, name: "QC Filtering", desc: "Parses ARGO QC flags. Retains only verified good readings (Flags 1, 2) to assure validity." },
            { step: "05", icon: Database, name: "PostgreSQL DB", desc: "Stores sanitized data in tables with multi-column spatial, temporal, and depth indices." }
          ].map((s, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-sky-400/20 font-mono leading-none">{s.step}</span>
                <s.icon className="h-4.5 w-4.5 text-sky-400" />
              </div>
              <h4 className="font-bold text-xs text-slate-200">{s.name}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. QUERY PIPELINE CARDS */}
      <section className="glass-card p-6 rounded-2xl flex flex-col gap-6">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900 justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5.5 w-5.5 text-indigo-400 animate-pulse" />
            <h3 className="font-display font-bold text-base text-slate-100">02. Conversational RAG Query Pipeline</h3>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            Real-time On-demand
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          FloatChat decodes user intents dynamically, converting natural-language statements into safe relational queries.
        </p>

        {/* Stepper Graph */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {[
            { step: "01", name: "User Natural Query", details: "Accepts raw natural language (e.g. 'Show salinity at equator in March 2023')" },
            { step: "02", name: "LLM + RAG Metadata", details: "LangChain queries vector store to fetch DB schema details, variable units, and coordinate bounds." },
            { step: "03", name: "Text-to-SQL Translation", details: "Dynamic translation model writes equivalent safe SELECT query containing filters." },
            { step: "04", name: "SQL Validation Check", details: "Validator intercepts SQL. Permits SELECT queries on whitelist tables. Rejects updates/deletes." },
            { step: "05", name: "Database Querying", details: "Runs validated SELECT query against Indexed PostgreSQL / SQLite fallback." },
            { step: "06", name: "Plotly & Leaflet Visuals", details: "Extracts rows, auto-generating coordinates trajectories (Leaflet) and profiles (Plotly)." },
            { step: "07", name: "Plain-language Insight", details: "Generates plain-language explanation of thermal/salinity layers using actual values." },
            { step: "08", name: "Dynamic Display", details: "Presents maps, charts, raw data matrix, and text explanation directly to user." }
          ].map((s, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-400/25 font-mono leading-none">STAGE {s.step}</span>
                <Sparkles className="h-3.5 w-3.5 text-indigo-450" />
              </div>
              <h4 className="font-bold text-xs text-slate-200">{s.name}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{s.details}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. DETAILED ARCHITECTURE MATRIX */}
      <section className="glass-card p-6 rounded-2xl flex flex-col gap-4">
        <h4 className="font-display font-bold text-sm text-slate-200 mb-2 border-b border-slate-900 pb-2">Technical Implementation Blueprint</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col gap-3">
            <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px]">Data Flow Stack</span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">File Ingestion:</strong>
                <span className="text-slate-500 font-mono">netCDF4, xarray</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Data Vector Wrangling:</strong>
                <span className="text-slate-500 font-mono">Pandas, NumPy</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Primary Database:</strong>
                <span className="text-slate-500 font-mono">PostgreSQL / SQLite</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Vector Indexing:</strong>
                <span className="text-slate-500 font-mono">pgvector / FAISS / TF-IDF Cosine</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col gap-3">
            <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">Query Execution Stack</span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">NLP Routing & Prompting:</strong>
                <span className="text-slate-500 font-mono">LangChain (ChatOpenAI)</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">SQL Code Validation:</strong>
                <span className="text-slate-500 font-mono">Regex safe whitelist validator</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Geo Plotting Mapping:</strong>
                <span className="text-slate-500 font-mono">Leaflet.js + OSM Dark Tiles</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Dynamic Profiling Charting:</strong>
                <span className="text-slate-500 font-mono">Plotly.js Dist Min</span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default HowItWorks;
