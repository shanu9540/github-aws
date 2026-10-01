import React, { useState } from 'react';
import {
  Terminal,
  GitPullRequest,
  Layers,
  Server,
  Cpu,
  Globe,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import { ARCHITECTURE_NODES } from '../data/projectData';
import { LanguageMode } from '../types/pipeline';

interface ArchitectureDiagramProps {
  language: LanguageMode;
  onSelectStep: (stepId: string) => void;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  language,
  onSelectStep,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('github');

  const selectedNode =
    ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId) ||
    ARCHITECTURE_NODES[1];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Terminal':
        return <Terminal className="w-5 h-5" />;
      case 'GitPullRequest':
        return <GitPullRequest className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'Server':
        return <Server className="w-5 h-5" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5" />;
      case 'Globe':
        return <Globe className="w-5 h-5" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1 tracking-wider uppercase">
            <span>DevOps Architecture Blueprint</span>
            <span>·</span>
            <span>AWS Cloud Deployment</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            End-to-End CI/CD Pipeline on AWS EC2
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {language === 'hinglish'
              ? 'Ye system diagram dikhata hai ki aapka code local machine se push hokar kaise GitHub Actions ke through Docker container banta hai aur AWS EC2 server pe automatically deploy hota hai.'
              : 'Interactive visual workflow tracing code from local git commit through automated testing, container registry packaging, and zero-downtime AWS EC2 deployment.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Click any block to inspect deep DevOps specs</span>
        </div>
      </div>

      {/* Interactive Visual Flow Diagram */}
      <div className="relative p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 overflow-x-auto">
        <div className="min-w-[780px] grid grid-cols-6 gap-3 items-center">
          {ARCHITECTURE_NODES.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <button
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between h-36 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`p-2 rounded-md ${
                        isSelected
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {getIcon(node.icon)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      0{index + 1}
                    </span>
                  </div>

                  <div>
                    <h3
                      className={`text-xs font-semibold leading-tight ${
                        isSelected ? 'text-amber-300' : 'text-slate-200'
                      }`}
                    >
                      {node.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {node.subtitle}
                    </p>
                  </div>

                  <div className="text-[9px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>{isSelected ? 'Viewing' : 'Inspect'}</span>
                    <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                  </div>
                </button>

                {/* Arrow connector except last */}
                {index < ARCHITECTURE_NODES.length - 1 && (
                  <div className="hidden pointer-events-none" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Flow Indicators */}
        <div className="min-w-[780px] flex items-center justify-between text-[11px] font-mono text-slate-400 mt-4 px-2 pt-3 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">1. Trigger:</span>
            <span>git push</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">2. CI:</span>
            <span>Test & Buildx</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">3. Registry:</span>
            <span>Push :latest</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">4. CD:</span>
            <span>SSH to EC2</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">5. Verify:</span>
            <span>curl /health</span>
          </div>
        </div>
      </div>

      {/* Selected Node In-Depth Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>INSPECTING NODE</span>
                <span>·</span>
                <span className="text-amber-400 font-semibold">
                  {selectedNode.subtitle}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {selectedNode.title}
              </h3>
            </div>
            <span className="p-2.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {getIcon(selectedNode.icon)}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedNode.desc}
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Key Operational Responsibilities
            </h4>
            <ul className="space-y-1.5">
              {selectedNode.details.map((detail, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Node Security & Fail-Safe Tips */}
        <div className="space-y-3 bg-slate-950/70 p-4 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Production Security Rule</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedNode.id === 'github' &&
                'Store all server IP addresses and SSH keys inside GitHub Encrypted Secrets. Never commit passwords or .pem files into version control.'}
              {selectedNode.id === 'developer' &&
                'Always run "docker build" locally once before pushing to remote repository to catch syntax errors and missing package dependencies early.'}
              {selectedNode.id === 'registry' &&
                'Use fine-grained Personal Access Tokens (PAT) with only Read & Write repo permissions rather than master account credentials.'}
              {selectedNode.id === 'ec2' &&
                'Configure Inbound Security Group rules strictly: open Port 80 for web traffic, Port 443 for TLS, and Port 22 SSH restricted to secure origins.'}
              {selectedNode.id === 'container' &&
                'Execute container process as non-root user (e.g. USER node in Dockerfile) to mitigate container breakout vulnerabilities.'}
              {selectedNode.id === 'user' &&
                'Expose port 80/443 externally while the application runs safely mapped to an internal container port with automatic restart on failure.'}
            </p>
          </div>

          <button
            onClick={() => onSelectStep('step-1')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>View Implementation Steps</span>
          </button>
        </div>
      </div>
    </div>
  );
};
