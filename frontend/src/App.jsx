import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  LayoutDashboard, 
  HelpCircle, 
  Compass, 
  Database,
  Sparkles,
  Heart,
  BookOpen,
  Info
} from 'lucide-react';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import HowItWorks from './pages/HowItWorks';
import Impact from './pages/Impact';
import About from './pages/About';

function App() {
  const getInitialPage = () => {
    const path = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
    switch (path) {
      case 'explore':
        return 'explore';
      case 'dashboard':
        return 'dashboard';
      case 'how-it-works':
        return 'how_it_works';
      case 'impact':
        return 'impact';
      case 'about':
        return 'about';
      default:
        return 'home';
    }
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage());
  const [pendingQuery, setPendingQuery] = useState(null);

  const navigate = (pageId, query = null) => {
    if (query) {
      setPendingQuery(query);
    }
    setCurrentPage(pageId);
    
    let path = '/';
    if (pageId !== 'home') {
      path = `/${pageId.replace(/_/g, '-')}`;
    }
    
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  // Synchronize state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
      switch (path) {
        case 'explore':
          setCurrentPage('explore');
          break;
        case 'dashboard':
          setCurrentPage('dashboard');
          break;
        case 'how-it-works':
          setCurrentPage('how_it_works');
          break;
        case 'impact':
          setCurrentPage('impact');
          break;
        case 'about':
          setCurrentPage('about');
          break;
        default:
          setCurrentPage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={navigate} />;
      case 'explore':
        return (
          <Chat 
            pendingQuery={pendingQuery} 
            clearPendingQuery={() => setPendingQuery(null)} 
          />
        );
      case 'dashboard':
        return <Dashboard />;
      case 'how_it_works':
        return <HowItWorks />;
      case 'impact':
        return <Impact />;
      case 'about':
        return <About />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-navy-950 text-slate-100 selection:bg-sky-500 selection:text-white relative overflow-hidden ocean-grid-bg">
      
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-500/5 blur-[130px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none animate-pulse-slow"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full glass border-b border-slate-800/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate('home')}
          >
            <div className="p-2 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl text-white shadow-lg shadow-sky-500/15 group-hover:scale-105 transition-all duration-300">
              <Compass className="h-5.5 w-5.5 animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
                FloatChat
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                Ocean Intelligence
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {[
              { id: 'home', label: 'Home' },
              { id: 'explore', label: 'Explore' },
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'how_it_works', label: 'How It Works' },
              { id: 'impact', label: 'Impact' },
              { id: 'about', label: 'About' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  currentPage === tab.id 
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* AI online indicator status */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse glow-dot"></span>
              AI Online
            </span>
            <span className="sm:hidden h-2 w-2 rounded-full bg-emerald-500 animate-pulse glow-dot"></span>
          </div>

        </div>
      </header>

      {/* Mobile nav indicator bar */}
      <div className="md:hidden w-full glass border-b border-slate-900 px-4 py-2 flex items-center justify-around gap-1 overflow-x-auto text-[10px] uppercase font-bold tracking-wider">
        {[
          { id: 'home', label: 'Home' },
          { id: 'explore', label: 'Explore' },
          { id: 'dashboard', label: 'Dash' },
          { id: 'how_it_works', label: 'Workflow' },
          { id: 'impact', label: 'Impact' },
          { id: 'about', label: 'About' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={`px-2.5 py-1 rounded transition-colors ${
              currentPage === tab.id ? 'bg-sky-500/10 text-sky-400 border border-sky-400/20' : 'text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-start relative z-10 animate-fade-in">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="w-full glass border-t border-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              FloatChat — Smart India Hackathon Prototype
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Analyzing ocean thermodynamic variations utilizing ARGO float netCDF ingestion, safe Text-to-SQL, and vector RAG.
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-xs">
            <span className="flex items-center gap-1.5 text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-1.5 rounded-lg">
              <Database className="h-3.5 w-3.5 text-sky-400" /> PostgreSQL + SQLite Fallback
            </span>
            <span className="flex items-center gap-1.5 text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-1.5 rounded-lg">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> LangChain Orchestrated
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
