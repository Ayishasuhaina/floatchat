import React from 'react';
import { 
  Heart, 
  Target, 
  TrendingUp, 
  HelpCircle, 
  Globe, 
  Anchor, 
  Layers, 
  Compass,
  FileText
} from 'lucide-react';

const Impact = () => {
  return (
    <div className="flex flex-col gap-8 py-4 max-w-6xl mx-auto w-full animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl text-slate-100">From Ocean Data to Ocean Decisions</h1>
        <p className="text-xs text-slate-400">Socio-economic impact of democratizing climate telemetry alongside SDG Goal integrations</p>
      </div>

      {/* Target User Archetypes */}
      <section className="glass-card p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
          <Target className="h-5.5 w-5.5 text-sky-400" />
          <h3 className="font-display font-bold text-base text-slate-100">Target User Profiles</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              role: "Researchers / Oceanographers",
              desc: "Provides rapid spatial and vertical filtering of temperature and salinity profiles, saving hours spent on parsing codes.",
              color: "border-sky-500/20 text-sky-400 bg-sky-500/5"
            },
            {
              role: "Students / Educators",
              desc: "Allows interactive exploration of vertical thermal structures and density gradients without pre-requisite programming skills.",
              color: "border-indigo-500/20 text-indigo-400 bg-indigo-500/5"
            },
            {
              role: "Policymakers / Coastal Authorities",
              desc: "Enables natural-language extraction of regional warming trends to guide marine protected zone regulations.",
              color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
            },
            {
              role: "Journalists / General Public",
              desc: "Provides direct access to raw, verifiable ocean observations, supporting factual reporting on climate events.",
              color: "border-purple-500/20 text-purple-400 bg-purple-500/5"
            },
            {
              role: "Blue Economy Operators",
              desc: "Enables aquaculture and marine planners to monitor salinity fluctuations and local dissolved oxygen dead zones.",
              color: "border-rose-500/20 text-rose-400 bg-rose-500/5"
            }
          ].map((u, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2 ${u.color}`}>
              <h4 className="font-bold text-xs text-slate-100">{u.role}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sustainable Development Goals Integration */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SDG 13: Climate Action */}
        <div className="glass-card p-6 rounded-2xl border-t-4 border-t-sky-500 flex flex-col gap-4">
          <div className="flex items-center gap-3 pb-2.5 border-b border-slate-900">
            <span className="text-sm font-extrabold bg-sky-500/10 text-sky-400 px-3 py-1 rounded border border-sky-400/20">
              Goal 13
            </span>
            <div>
              <h4 className="font-display font-bold text-base text-slate-100">SDG 13: Climate Action</h4>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Climate Warming Trajectories</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            The global ocean absorbs more than 90% of Earth's excess heat. ARGO float networks serve as the primary thermometer measuring this accumulation.
          </p>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-855 flex flex-col gap-2 text-[11px] text-slate-450 leading-relaxed">
            <p>
              <strong>Heat Accumulation:</strong> FloatChat makes thermal profiles accessible in real-time, allowing users to identify vertical thermocline trends and mixed layer depths.
            </p>
            <p>
              <strong>Weather Models Support:</strong> Monitoring these temperature profiles is critical for identifying regional sea surface temperature anomalies that drive monsoons and tropical cyclones.
            </p>
          </div>
        </div>

        {/* SDG 14: Life Below Water */}
        <div className="glass-card p-6 rounded-2xl border-t-4 border-t-emerald-500 flex flex-col gap-4">
          <div className="flex items-center gap-3 pb-2.5 border-b border-slate-900">
            <span className="text-sm font-extrabold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded border border-emerald-400/20">
              Goal 14
            </span>
            <div>
              <h4 className="font-display font-bold text-base text-slate-100">SDG 14: Life Below Water</h4>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Marine Habitat Monitoring</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            Salinity gradients determine ocean circulation and current speeds, while dissolved oxygen levels govern the health of marine species.
          </p>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-855 flex flex-col gap-2 text-[11px] text-slate-455 leading-relaxed">
            <p>
              <strong>Salinity Monitoring:</strong> High salinity (e.g. in the Arabian Sea) affects water column density. FloatChat charts these salinity profiles to map vertical mixing patterns.
            </p>
            <p>
              <strong>Dead Zone Tracking:</strong> Users can query dissolved oxygen profiles to locate hypoxic zones (Oxygen Minimum Zones), where levels drop below 60 µmol/kg, threatening fish populations.
            </p>
          </div>
        </div>

      </section>

      {/* Blue Economy & Scientific Conservation Support */}
      <section className="glass-card p-5 rounded-2xl">
        <h4 className="font-display font-bold text-sm text-slate-200 mb-3.5 border-b border-slate-900 pb-2 flex items-center gap-2">
          <Anchor className="h-4.5 w-4.5 text-indigo-400" />
          Evidence-Based Support Applications
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-400">
          <div>
            <strong className="text-slate-200 block mb-1">Sustainable Aquaculture</strong>
            Helps site local fish pens by monitoring seasonal oxygen minimum zone depth levels and surface temperature ranges.
          </div>
          <div>
            <strong className="text-slate-200 block mb-1">Coastal Habitat Protection</strong>
            Identifies heatwaves and low-salinity runoff cycles that trigger coral bleaching and algal blooms.
          </div>
          <div>
            <strong className="text-slate-200 block mb-1">Climate Communication</strong>
            Empowers educators to create visual maps of physical parameters to explain thermodynamic concepts interactively.
          </div>
        </div>
      </section>

    </div>
  );
};

export default Impact;
