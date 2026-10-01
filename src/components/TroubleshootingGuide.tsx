import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Terminal,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { TROUBLESHOOTING_ITEMS } from '../data/projectData';
import { LanguageMode } from '../types/pipeline';

interface TroubleshootingGuideProps {
  language: LanguageMode;
}

export const TroubleshootingGuide: React.FC<TroubleshootingGuideProps> = ({
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = TROUBLESHOOTING_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symptom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copySolution = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <span>DEVOPS RUNBOOK</span>
            <span>·</span>
            <span>INCIDENT TRIAGE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            AWS EC2 &amp; Docker Troubleshooting Guide
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {language === 'hinglish'
              ? 'Jab aap pipeline deploy karoge toh aksar permission, security group ya port binding ke errors aate hain. Yahan un sabhi common issues ka exact fix diya hai.'
              : 'Battle-tested solutions for SSH authentication failures, Security Group timeouts, Docker socket permission issues, and port collisions.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search symptoms, errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none text-slate-200 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const isExpanded = expandedIndex === index;
          const isCopied = copiedId === `trouble-${index}`;

          return (
            <div
              key={index}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-slate-900/80 border-amber-400/50'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header clickable row */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full flex items-start justify-between p-4 text-left cursor-pointer gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="p-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 mt-0.5 shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                      <span>{item.category}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs font-mono text-rose-300/80 mt-1 line-clamp-1">
                      {item.symptom}
                    </p>
                  </div>
                </div>

                <div className="text-slate-400 pt-1 shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Expanded solution view */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                      Root Cause Analysis
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.cause}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Step-by-Step Resolution
                      </h4>
                      <button
                        onClick={() => copySolution(item.solution, `trouble-${index}`)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer font-mono"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{isCopied ? 'Copied' : 'Copy Fix'}</span>
                      </button>
                    </div>

                    <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed">
                      {item.solution}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center p-8 text-xs text-slate-500 font-mono bg-slate-900/30 rounded-xl border border-slate-800">
            No matching issues found for &ldquo;{searchTerm}&rdquo;. Try another term like &ldquo;ssh&rdquo;, &ldquo;docker&rdquo;, or &ldquo;port&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
};
