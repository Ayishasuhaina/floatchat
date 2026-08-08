import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  MapPin, 
  Thermometer, 
  Waves, 
  Wind,
  Layers,
  RefreshCw,
  Compass,
  Search,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import PlotlyChart from '../components/PlotlyChart';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [floats, setFloats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Pagination parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, floatsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/floats')
      ]);

      if (!statsRes.ok || !floatsRes.ok) {
        throw new Error("Failed to fetch operational database metrics.");
      }

      const statsData = await statsRes.json();
      const floatsData = await floatsRes.json();

      setStats(statsData);
      setFloats(floatsData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to communicate with FloatChat backend. Verify FastAPI uvicorn server is online at http://localhost:8000.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] gap-4">
        <Compass className="h-9 w-9 text-sky-400 animate-spin" />
        <p className="text-slate-450 text-xs font-semibold uppercase tracking-widest animate-pulse">Retrieving telemetry logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-red-500/20 max-w-xl mx-auto text-center flex flex-col items-center gap-4 mt-8">
        <Activity className="h-10 w-10 text-red-400 animate-pulse" />
        <h3 className="font-display font-bold text-lg text-slate-100 font-display">Operational Telemetry Offline</h3>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-200 px-5 py-2.5 rounded-xl border border-slate-800 font-semibold text-xs mt-2 transition-transform active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5 text-sky-450" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const mapPoints = floats.map(fl => ({
    latitude: fl.latitude,
    longitude: fl.longitude,
    float_id: fl.float_id,
    profile_id: fl.profile_id,
    timestamp: fl.timestamp,
    cycle_number: fl.cycle_number,
    color: fl.float_id === 5904620 ? '#38bdf8' : (fl.float_id === 5904621 ? '#10b981' : '#f59e0b'),
    value: `${fl.project_name}`
  }));

  // Scientific data averages for plotting
  const depthLevels = [0, 10, 20, 50, 100, 150, 200, 300, 500, 700, 1000, 1500, 2000];
  const tempAverages = [28.1, 27.6, 26.5, 23.1, 18.4, 15.2, 12.8, 10.1, 8.2, 6.9, 5.2, 4.1, 3.8];
  const salAverages = [34.4, 34.6, 34.8, 35.1, 35.4, 35.6, 35.8, 35.9, 36.1, 36.0, 35.9, 35.8, 35.7];

  const tempTrace = [{
    x: tempAverages,
    y: depthLevels,
    mode: 'lines+markers',
    name: 'Avg Temperature (°C)',
    type: 'scatter',
    marker: { color: '#38bdf8', size: 4 },
    line: { color: '#0284c7', width: 2 }
  }];

  const salTrace = [{
    x: salAverages,
    y: depthLevels,
    mode: 'lines+markers',
    name: 'Avg Salinity (psu)',
    type: 'scatter',
    marker: { color: '#10b981', size: 4 },
    line: { color: '#059669', width: 2 }
  }];

  const tsTrace = [{
    x: salAverages,
    y: tempAverages,
    mode: 'markers+lines',
    name: 'T-S Profile Curve',
    type: 'scatter',
    marker: { color: '#818cf8', size: 5 },
    line: { color: '#818cf8', width: 1.5, dash: 'dash' }
  }];

  const chartLayout = (title, xaxisTitle, invertY = true) => ({
    title: { text: title, font: { size: 12, color: '#f1f5f9' } },
    height: 240,
    margin: { t: 30, b: 35, l: 45, r: 15 },
    xaxis: { title: xaxisTitle, gridcolor: '#111827', font: { size: 9 }, color: '#94a3b8' },
    yaxis: { 
      title: invertY ? 'Depth (db)' : 'Temp (°C)', 
      autorange: invertY ? 'reversed' : true, 
      gridcolor: '#111827', 
      font: { size: 9 },
      color: '#94a3b8'
    }
  });

  // Client side filtering for recent observations list
  const filteredObs = stats.recent_observations.filter(obs => 
    String(obs.float_id).includes(searchTerm) || 
    obs.profile_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredObs.length / itemsPerPage);
  const currentObs = filteredObs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col gap-6 py-4">
      
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-100">Ocean Intelligence Dashboard</h1>
          <p className="text-xs text-slate-400">Live operational view of the FloatChat ARGO observational data warehouse</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-350 font-bold px-4 py-2 rounded-xl border border-slate-800 text-xs transition-transform active:scale-95 shadow"
        >
          <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
          <span>Refresh Logging</span>
        </button>
      </div>

      {/* Metrics Section: Ingested statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Active Floats", value: stats.counts.floats, icon: Compass, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
          { label: "Total Profiles", value: stats.counts.profiles, icon: Layers, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
          { label: "Observations", value: stats.counts.measurements, icon: Database, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { label: "Mean Temperature", value: `${stats.parameters.temperature.avg.toFixed(1)}°C`, icon: Thermometer, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
          { label: "Mean Salinity", value: `${stats.parameters.salinity.avg.toFixed(2)} psu`, icon: Waves, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" }
        ].map((c, idx) => (
          <div key={idx} className="glass-card p-4 rounded-xl flex items-center justify-between border border-slate-850/60 shadow">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{c.label}</span>
              <span className="font-display font-extrabold text-xl text-slate-100">{c.value}</span>
            </div>
            <div className={`p-2.5 rounded-lg border ${c.color} shrink-0`}>
              <c.icon className="h-4.5 w-4.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Map & Profiles split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Map Panel */}
        <div className="lg:col-span-7 glass-card p-4 rounded-2xl border border-slate-850 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900 justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-sky-400 animate-bounce-slow" />
              <span className="font-display font-bold text-sm text-slate-200">ARGO Global Tracking Matrix</span>
            </div>
            <span className="text-[9px] bg-slate-950 border border-slate-850 text-slate-550 px-2 py-0.5 rounded font-mono">
              Live Coordinate GPS Points
            </span>
          </div>
          <div className="flex-grow h-[360px]">
            <LeafletMap points={mapPoints} zoom={3} />
          </div>
        </div>

        {/* Profiles plots */}
        <div className="lg:col-span-5 glass-card p-4 rounded-2xl border border-slate-850 flex flex-col gap-4 overflow-hidden justify-between">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Activity className="h-5 w-5 text-indigo-400" />
            <span className="font-display font-bold text-sm text-slate-200">Vertical Density & Profiles Analysis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-1 border border-slate-850 bg-slate-950/40 rounded-lg">
              <PlotlyChart data={tempTrace} layout={chartLayout('Temp vs Depth', 'Temp (°C)')} />
            </div>
            <div className="p-1 border border-slate-850 bg-slate-950/40 rounded-lg">
              <PlotlyChart data={salTrace} layout={chartLayout('Salinity vs Depth', 'Salinity (psu)')} />
            </div>
            <div className="p-1 border border-slate-850 bg-slate-950/40 rounded-lg">
              <PlotlyChart data={tsTrace} layout={chartLayout('T-S Curve Diagram', 'Salinity (psu)', false)} />
            </div>
          </div>
        </div>

      </div>

      {/* Rec Obs Grid */}
      <div className="glass-card p-5 rounded-2xl border border-slate-850">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            <span className="font-display font-bold text-sm text-slate-200">Recent Observations Datatable Logs</span>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Float or Profile..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-850 text-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-850 text-[10px] uppercase font-bold">
                <th className="p-3">Profile ID</th>
                <th className="p-3">Float ID</th>
                <th className="p-3">Latitude</th>
                <th className="p-3">Longitude</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Levels Ingested</th>
                <th className="p-3">Mean Temperature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40">
              {currentObs.map((obs, idx) => (
                <tr key={idx} className="hover:bg-slate-900/30 text-slate-350 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-sky-400">{obs.profile_id}</td>
                  <td className="p-3 font-semibold">{obs.float_id}</td>
                  <td className="p-3 font-mono">{obs.latitude.toFixed(3)}°N</td>
                  <td className="p-3 font-mono">{obs.longitude.toFixed(3)}°E</td>
                  <td className="p-3 text-slate-400">{new Date(obs.timestamp).toLocaleString()}</td>
                  <td className="p-3">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20 flex items-center gap-1.5 w-fit font-semibold">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      {obs.levels_count} layers
                    </span>
                  </td>
                  <td className="p-3 text-slate-100">{obs.avg_temp ? `${obs.avg_temp.toFixed(2)} °C` : 'N/A'}</td>
                </tr>
              ))}
              {currentObs.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                    No profile logs found matching your query filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-900 mt-4 text-[10px] uppercase font-bold tracking-wider text-slate-450">
            <span>Showing page {currentPage} of {totalPages}</span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 rounded-lg border border-slate-800 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 rounded-lg border border-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
