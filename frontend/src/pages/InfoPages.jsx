import React, { useState } from 'react';
import { 
  HelpCircle, 
  Settings, 
  ShieldAlert, 
  Heart, 
  BookOpen, 
  FileText,
  Flame,
  Globe,
  Database,
  Search,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const InfoPages = () => {
  const [activeTab, setActiveTab] = useState('architecture');

  const tabs = [
    { id: 'architecture', label: 'Technical Architecture', icon: Settings },
    { id: 'challenges', label: 'Challenges & Strategies', icon: ShieldAlert },
    { id: 'impact', label: 'Impact & SDGs', icon: Heart },
    { id: 'feasibility', label: 'Feasibility & References', icon: BookOpen }
  ];

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-slate-100">Hackathon Hub</h1>
        <p className="text-xs text-slate-400">Detailed system blueprints, feasibility studies, challenges, solutions, and SDG alignments for judges review</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-2 min-h-[450px]">
        
        {/* 1. TECHNICAL ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Structural Summary */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-3">
              <h3 className="font-display font-bold text-lg text-slate-200">System Core Workflow</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                FloatChat builds a bridge between complex spatial binary scientific files (NetCDF) and plain language queries. 
                Below is the exact execution pipeline for natural language requests.
              </p>
              
              {/* Process Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                {[
                  { step: "01", title: "ARGO Ingest", desc: "xarray parses NetCDF files from global repositories." },
                  { step: "02", title: "QC Filtering", desc: "Erroneous records are filtered based on QC flag standards." },
                  { step: "03", title: "Schema RAG", desc: "Vector similarity identifies relevant tables and variable units." },
                  { step: "04", title: "Safe SQL", desc: "Text-to-SQL is validated to prevent injection or modification." },
                  { step: "05", title: "Render Viz", desc: "Plotly profiles and Leaflet coordinate grids display results." }
                ].map((s, idx) => (
                  <div key={idx} className="relative p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col gap-2">
                    <span className="text-xl font-extrabold text-sky-400/30 font-mono">{s.step}</span>
                    <h4 className="font-bold text-xs text-slate-200">{s.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Database className="h-5 w-5 text-sky-400" />
                  <h4 className="font-display font-bold text-sm text-slate-200">Relational Database Schemas</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our schema divides ARGO observations logically to allow fast geographic sub-setting:
                </p>
                <div className="flex flex-col gap-3 font-mono text-[11px]">
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                    <strong className="text-sky-400">floats:</strong> stores static float meta (float_id, project_name, pi_name).
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                    <strong className="text-sky-400">profiles:</strong> indexes temporal and spatial vectors (profile_id, float_id, latitude, longitude, timestamp, cycle_number).
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                    <strong className="text-sky-400">measurements:</strong> vertical layers of physical readings (depth, temperature, salinity, oxygen, and parameter-specific QC status flags).
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Globe className="h-5 w-5 text-indigo-400" />
                  <h4 className="font-display font-bold text-sm text-slate-200">Metadata Vector Search (RAG)</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  To guide the LLM, a localized Vector Store is seeded on startup containing descriptions, boundaries, and variables:
                </p>
                <ul className="text-xs text-slate-400 list-disc list-inside flex flex-col gap-2 leading-relaxed">
                  <li><strong>Semantic Variables:</strong> Maps "saltiness" to PSAL, "heat" to TEMP, and "doxy" to OXYGEN.</li>
                  <li><strong>Units Store:</strong> Stores TEMP in °C, Salinity in psu, and Oxygen in µmol/kg.</li>
                  <li><strong>Bounding Coordinates:</strong> Defines Indian Ocean limits and Equator latitude tolerances.</li>
                  <li><strong>Schema Maps:</strong> Pre-injects SQL schemas directly into LLM prompts so it matches columns without hallucinating.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 2. CHALLENGES & RISK OVERCOMING STRATEGIES */}
        {activeTab === 'challenges' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-display font-bold text-lg text-slate-200">Challenges & Solutions Analysis</h3>
              <p className="text-xs text-slate-400 mt-1">Our strategies to mitigate production risks associated with Text-to-SQL pipelines</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  challenge: "LLM / Text-to-SQL Hallucination",
                  risk: "LLMs generating incorrect table joins, fictional columns, or invalid SQL formats.",
                  strategy: "Schema-Aware RAG context combined with a strict pre-execution SQL Validation Engine. Rejects queries that attempt catalog access, references non-existent columns, or contains modifications.",
                  icon: AlertTriangle,
                  color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
                },
                {
                  challenge: "Massive NetCDF Ingestion Volumes",
                  risk: "ARGO floats produce millions of profile levels daily; parsing blocks API threads.",
                  strategy: "Implemented batch ingestion processing utilizing Python's fast xarray memory-mapped vectors. Utilizes structured index tables and multi-column spatial indexing on Lat/Lon/Time.",
                  icon: Database,
                  color: "text-sky-400 bg-sky-500/10 border-sky-500/20"
                },
                {
                  challenge: "Ambiguous User Questions",
                  risk: "Users asking non-quantified questions like 'How is the ocean doing?' which cannot translate to SQL.",
                  strategy: "Semantic intent classifier acts as a router. Identifies vague requests and returns immediate, friendly clarification prompts asking for parameter definitions.",
                  icon: Search,
                  color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                },
                {
                  challenge: "Data Quality and Sensor Calibration",
                  risk: "ARGO sensors drift over time, returning erroneous temperature or salinity spikes.",
                  strategy: "Rigorous pipeline ingestion validation. Interprets official ARGO QC codes (values 3 & 4 denote questionable or bad sensor records) and filters them out before saving to the user-facing database.",
                  icon: CheckCircle,
                  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                }
              ].map((c, idx) => (
                <div key={idx} className="glass-card p-6 rounded-2xl flex flex-col gap-4 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${c.color}`}>
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-100">{c.challenge}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Risk Assessment</p>
                    </div>
                  </div>
                  <div className="text-xs flex flex-col gap-2 leading-relaxed">
                    <p className="text-slate-400"><strong>The Risk:</strong> {c.risk}</p>
                    <p className="text-slate-300"><strong>Our Mitigation Strategy:</strong> {c.strategy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. IMPACT & BENEFITS (SDGS) */}
        {activeTab === 'impact' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Impact Introduction */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-3">
              <h3 className="font-display font-bold text-lg text-slate-200">Socio-Economic & Scientific Impact</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                By removing the technical syntax barrier (Python/xarray/SQL) required to read NetCDF data, FloatChat empowers a wide spectrum of target users.
              </p>
            </div>

            {/* SDG Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* SDG 13 */}
              <div className="glass-card p-6 rounded-2xl border-l-4 border-l-sky-500 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <span className="text-xl font-bold bg-sky-500/10 text-sky-400 px-3 py-1 rounded">SDG 13</span>
                  <h4 className="font-display font-bold text-base text-slate-100">Climate Action</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ARGO floats are the primary tool for measuring Earth's heating. The ocean absorbs over 90% of excess heat energy added to the atmosphere.
                </p>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col gap-2 text-xs text-slate-400 leading-relaxed">
                  <p><strong>Long-term Trends:</strong> FloatChat tracks variations in sea surface temperature (SST) and thermocline depth, capturing climate fluctuations over seasons.</p>
                  <p><strong>Carbon Sink Tracking:</strong> Monitoring dissolved oxygen levels provides policymakers with quantitative values of marine oxygen depletion, guiding ocean recovery legislation.</p>
                </div>
              </div>

              {/* SDG 14 */}
              <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <span className="text-xl font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded">SDG 14</span>
                  <h4 className="font-display font-bold text-base text-slate-100">Life Below Water</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Salinity and temperature determine density patterns, which drive ocean currents, nutrient upwelling, and biological zones.
                </p>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col gap-2 text-xs text-slate-400 leading-relaxed">
                  <p><strong>Salinity Stratification:</strong> Tracks marine salinity anomalies, helping marine biologists identify salinity-driven coral bleaching events.</p>
                  <p><strong>Habitat Mapping:</strong> Policymakers and environmental journalists can query oxygen levels versus depth to discover and chart expanding oceanic dead zones.</p>
                </div>
              </div>

            </div>

            {/* Target Users Specific Impact */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-display font-bold text-sm text-slate-200 mb-4 border-b border-slate-800 pb-2">Target User Benefits</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-slate-900/30 rounded-xl border border-slate-850">
                  <strong className="text-sky-400 block mb-1">Maritime Industry</strong>
                  Enables blue-economy operations to optimize aquaculture zones based on local salinity and oxygen trends.
                </div>
                <div className="p-3.5 bg-slate-900/30 rounded-xl border border-slate-850">
                  <strong className="text-indigo-400 block mb-1">Researchers</strong>
                  Speeds up data sub-setting, reducing hours spent writing custom NetCDF parsing scripts.
                </div>
                <div className="p-3.5 bg-slate-900/30 rounded-xl border border-slate-850">
                  <strong className="text-emerald-400 block mb-1">Students</strong>
                  Dynamic plots make fluid dynamics and thermal stratification concepts interactive and engaging.
                </div>
                <div className="p-3.5 bg-slate-900/30 rounded-xl border border-slate-850">
                  <strong className="text-purple-400 block mb-1">Journalists</strong>
                  Verifiable ocean observations can be extracted directly to report on ocean warming without intermediate filters.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. FEASIBILITY & REFERENCES */}
        {activeTab === 'feasibility' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Feasibility Assessment */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Flame className="h-5 w-5 text-amber-500" />
                <h3 className="font-display font-bold text-sm text-slate-100">Project Feasibility Study</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
                <div className="flex flex-col gap-2">
                  <strong className="text-slate-200">Data Feasibility</strong>
                  <p className="text-slate-400">
                    Highly Feasible. The global ARGO project stores all raw observational NetCDF files on public-access Global Data Assembly Centres (GDACs) in France and the US. 
                    Data is updated in near real-time, making ingestion pipelines highly sustainable.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <strong className="text-slate-200">Technical Feasibility</strong>
                  <p className="text-slate-400">
                    High Feasibility. Standardizing databases using Postgres (pgvector) allows seamless combining of tabular spatial data with LLM indexing. 
                    The combination of LangChain for generation and safe SQL validators ensures secure, reliable deployment.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <strong className="text-slate-200">Team Implementation Scope</strong>
                  <p className="text-slate-400">
                    Fits standard Hackathon cycles. The division of tasks between Python ingestion and React UI ensures modular parallel development. 
                    A self-contained local Demo Mode guarantees that judges can verify all workflows during presentations.
                  </p>
                </div>
              </div>
            </div>

            {/* Scientific References */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <BookOpen className="h-5 w-5 text-sky-400" />
                <h3 className="font-display font-bold text-sm text-slate-100">ARGO Project References & Citations</h3>
              </div>
              <div className="flex flex-col gap-4 text-xs">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-200">Argo User's Manual (v3.42)</h5>
                    <p className="text-slate-400 mt-1">Official manual for data variables, flag standards, trajectory models, and coordinate parameters.</p>
                    <a href="https://dx.doi.org/10.13155/29825" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline inline-block mt-1 font-mono text-[10px]">DOI: 10.13155/29825</a>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-200">Argo Quality Control Manual (v3.3)</h5>
                    <p className="text-slate-400 mt-1">Guidelines for real-time and delayed-mode data QC flags, detailing temperature and salinity error filters.</p>
                    <a href="https://dx.doi.org/10.13155/22925" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline inline-block mt-1 font-mono text-[10px]">DOI: 10.13155/22925</a>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-200">Global ARGO GDAC Repositories</h5>
                    <p className="text-slate-400 mt-1">Primary servers hosted by IFREMER (France) and US GODAE (Monterey, US) for public HTTPS/FTP bulk NetCDF downloads.</p>
                    <a href="https://argo.ucsd.edu/data/" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline inline-block mt-1 font-mono text-[10px]">https://argo.ucsd.edu/data/</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InfoPages;
