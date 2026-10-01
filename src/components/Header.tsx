import React from 'react';
import { Download, Globe, Check } from 'lucide-react';
import { LanguageMode, ProjectConfig } from '../types/pipeline';
import { exportProjectZip } from '../utils/zipExporter';

interface HeaderProps {
  activeSection: string;
  setActiveSection: (id: string) => void;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  config: ProjectConfig;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  setActiveSection,
  language,
  setLanguage,
  config,
}) => {
  const [downloading, setDownloading] = React.useState(false);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  const navLinks = [
    { id: 'roadmap', label: 'Architecture' },
    { id: 'steps', label: 'Step-by-Step' },
    { id: 'simulator', label: 'Live Simulator' },
    { id: 'aws-suite', label: 'AWS Cloud & IaC' },
    { id: 'config', label: 'Code & Configs' },
    { id: 'troubleshoot', label: 'Troubleshooting' },
    { id: 'interview', label: 'Interview & Resume' },
  ];

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await exportProjectZip(config);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to download project zip:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => setActiveSection('roadmap')}
        className="text-base font-bold tracking-tight text-white hover:text-amber-400 transition-colors flex items-center gap-2 cursor-pointer"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
        <span>AWS Pipeline Engine</span>
      </button>

      {/* Zone 2: 4-6 text navigation links */}
      <nav className="hidden sm:flex items-center gap-4 lg:gap-6 text-xs font-medium tracking-wide overflow-x-auto py-1">
        {navLinks.map((link) => {
          const isActive = activeSection === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveSection(link.id)}
              className={`transition-colors cursor-pointer py-1 relative whitespace-nowrap ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {link.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {/* Language switch */}
        <button
          onClick={() =>
            setLanguage(language === 'hinglish' ? 'english' : 'hinglish')
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700/80 rounded-md hover:border-slate-600 transition-colors cursor-pointer whitespace-nowrap"
          title="Toggle Hinglish / English explanation"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'hinglish' ? 'Hinglish Mode' : 'English Mode'}</span>
        </button>

        {/* 1-click Download zip */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-amber-500/10 active:scale-95 disabled:opacity-50"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-slate-950" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>{downloading ? 'Packing...' : 'Download Code (.zip)'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
