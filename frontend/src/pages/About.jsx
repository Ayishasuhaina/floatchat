import React from 'react';
import { 
  Info, 
  HelpCircle, 
  Database, 
  ShieldAlert, 
  Flame, 
  BookOpen, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Compass
} from 'lucide-react';

const About = () => {
  return (
    <div className="flex flex-col gap-8 py-4 max-w-6xl mx-auto w-full animate-fade-in">
      
      {/* Page Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl text-slate-100">About FloatChat & ARGO</h1>
        <p className="text-xs text-slate-400">Scientific project origins, feasibility metrics, challenges mitigation, and official data citations</p>
      </div>

      {/* 1. WHAT IS ARGO */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <div className="md:col-span-7 glass-card p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
            <Compass className="h-5.5 w-5.5 text-sky-400 animate-spin-slow" />
            <h3 className="font-display font-bold text-base text-slate-100">What is ARGO?</h3>
          </div>
          <p className="text-xs text-slate-350 leading-relaxed">
            ARGO is a global network of autonomous profiling floats that drift in the deep ocean, measuring temperature, salinity, and dissolved oxygen. 
            Floats descend to depths of 2000 meters, drifting for 10-day cycles, before rising to the surface to transmit data to satellites.
          </p>
          <p className="text-xs text-slate-455 leading-relaxed">
            This network provides the foundation for modern global climate models and marine ecology research. 
            However, the data is stored in binary NetCDF files, which require heavy programming expertise to manipulate. 
            <strong> FloatChat</strong> bridges this gap by enabling natural language access to these critical datasets.
          </p>
        </div>

        <div className="md:col-span-5 glass-card p-6 rounded-2xl flex flex-col gap-3 justify-between bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/80">
          <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest leading-none">The Core Product Advantage</span>
          <div className="flex flex-col gap-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
              <strong className="text-slate-200">The Problem:</strong> Complex scientific files require programming knowledge, stopping policymakers and students from exploring the data.
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
              <strong className="text-sky-400">Our Solution:</strong> Natural-language conversational access to clean, parsed ocean databases.
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
              <strong className="text-emerald-400">Our Advantage:</strong> Integrates data retrieval, mapping, charting, and plain language explanations in one view.
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEASIBILITY cards */}
      <section className="glass-card p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
          <Flame className="h-5.5 w-5.5 text-amber-500" />
          <h3 className="font-display font-bold text-base text-slate-100">Project Feasibility Study</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          <div className="flex flex-col gap-2 p-4 bg-slate-950/50 rounded-xl border border-slate-850">
            <strong className="text-slate-250 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-sky-400" /> Data Feasibility
            </strong>
            <p className="text-slate-400">
              Highly feasible. All ARGO data is publicly accessible through Global Data Assembly Centres (GDACs). 
              The standardized file structures permit automated scheduling pipelines without sensor format conflicts.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 p-4 bg-slate-950/50 rounded-xl border border-slate-850">
            <strong className="text-slate-250 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" /> Technical Feasibility
            </strong>
            <p className="text-slate-400">
              High feasibility. Employs mature, production-grade tools: Python xarray, PostgreSQL (pgvector) indexing, safe SQL validators, and LangChain agents. 
              The architecture runs out-of-the-box in local environments.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-slate-950/50 rounded-xl border border-slate-850">
            <strong className="text-slate-250 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Team Feasibility
            </strong>
            <p className="text-slate-400">
              High feasibility. Extends established open-source libraries. 
              The application divides ingestion logic from the user interface, permitting rapid debugging and enhancements during development.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CHALLENGES & MITIGATIONS */}
      <section className="glass-card p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
          <ShieldAlert className="h-5.5 w-5.5 text-rose-500" />
          <h3 className="font-display font-bold text-base text-slate-100">Challenges & Mitigations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          {[
            {
              challenge: "LLM / Text-to-SQL Hallucination",
              mitigation: "Schema-Aware Prompting: Supplies metadata contexts (schema tables, column mappings, variables description) alongside a regex SQL safety validator checking read-only syntax."
            },
            {
              challenge: "Large NetCDF Dataset Volumes",
              mitigation: "Batch & Incremental Parsing: Ingests NetCDF vectors in chunks via xarray. Indexes keys (Latitude, Longitude, Depth, Timestamp) in PostgreSQL for fast sub-setting."
            },
            {
              challenge: "Ambiguous User Questions",
              mitigation: "Intent Router Classifier: A semantic regex/TF-IDF intent matcher intercepting vague queries (e.g. 'how is the sea') and returning helpful clarification prompts."
            },
            {
              challenge: "Telemetry Data Sensor Quality Issues",
              mitigation: "Ingestion QC Filtering: Scans standard QC flags in NetCDF files, replacing questionable parameter levels (QC flag 3 or 4) with NULLs to protect query accuracy."
            }
          ].map((c, idx) => (
            <div key={idx} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Challenge {idx + 1}</span>
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-550" /> {c.challenge}
              </h4>
              <p className="text-slate-400 mt-1"><strong>Mitigation:</strong> {c.mitigation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SCIENTIFIC REFERENCES */}
      <section className="glass-card p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
          <BookOpen className="h-5.5 w-5.5 text-sky-450" />
          <h3 className="font-display font-bold text-base text-slate-100">ARGO Citations & Technical References</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {[
            { title: "Argo Global Data Assembly Centre (GDAC)", details: "Public FTP and HTTPS servers hosting real-time binary NetCDF profiles.", link: "https://argo.ucsd.edu/data/" },
            { title: "Argo Data Selection Tool", details: "Official query interface for regional profile extractions.", link: "https://argo.ucsd.edu/data/data-selection-tool/" },
            { title: "Global Argo Data Repository / NOAA-NCEI", details: "Global archives of delayed-mode quality-controlled float measurements.", link: "https://www.ncei.noaa.gov/archive/archive-layouts/reference-manuals" },
            { title: "xarray & netCDF4 Pipeline Manual", details: "Established libraries for multi-dimensional scientific array operations.", link: "https://docs.xarray.dev/" },
            { title: "LangChain Framework Documentation", details: "Core prompting orchestrator managing SQL synthesis models.", link: "https://python.langchain.com/" },
            { title: "PostgreSQL pgvector Extension", details: "High-performance vector similarity search indexing tool.", link: "https://github.com/pgvector/pgvector" },
            { title: "Plotly.js Charting Documentation", details: "Interactive visualization library for scientific scientific diagrams.", link: "https://plotly.com/javascript/" },
            { title: "Argo Program General Information", details: "Project origins, drift mechanisms, and satellite telemetry grids.", link: "https://argo.ucsd.edu/" }
          ].map((r, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 flex items-start gap-3 hover:border-slate-800 transition-colors">
              <FileText className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-slate-200">{r.title}</h5>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">{r.details}</p>
                <a 
                  href={r.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-sky-400 hover:underline inline-block mt-2 font-mono text-[9px] truncate max-w-[200px]"
                >
                  {r.link}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default About;
