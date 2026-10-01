import React, { useState } from 'react';
import { Header } from './components/Header';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { StepByStepGuide } from './components/StepByStepGuide';
import { PipelineSimulator } from './components/PipelineSimulator';
import { ConfigGenerator } from './components/ConfigGenerator';
import { TroubleshootingGuide } from './components/TroubleshootingGuide';
import { InterviewResumeGuide } from './components/InterviewResumeGuide';
import { AwsAdvancedSuite } from './components/AwsAdvancedSuite';
import { DEFAULT_CONFIG } from './data/projectData';
import { LanguageMode, ProjectConfig } from './types/pipeline';
import {
  Server,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  GitBranch,
  Activity,
  Calculator,
  FileCode,
  ShieldAlert,
  Award,
} from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('roadmap');
  const [awsSuiteSubTab, setAwsSuiteSubTab] = useState<string>('monitoring');
  const [language, setLanguage] = useState<LanguageMode>('hinglish');
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [selectedInitialStep, setSelectedInitialStep] = useState<string>('step-1');

  const handleSelectStepFromArchitecture = (stepId: string) => {
    setSelectedInitialStep(stepId);
    setActiveSection('steps');
  };

  const handleOpenMonitoring = () => {
    setAwsSuiteSubTab('monitoring');
    setActiveSection('aws-suite');
  };

  const handleOpenCostCalculator = () => {
    setAwsSuiteSubTab('cost-calculator');
    setActiveSection('aws-suite');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract (Wordmark - Nav links - Actions) */}
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        language={language}
        setLanguage={setLanguage}
        config={config}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Quick KPI / Overview Badges (Unboxed clean metadata per constitution) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Target Platform:</span>
            <span className="text-amber-400 font-mono">AWS EC2 (Ubuntu 24.04 LTS)</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-semibold text-slate-300">Automation:</span>
            <span className="text-amber-400 font-mono">GitHub Actions / Jenkins</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-semibold text-slate-300">Virtualization:</span>
            <span className="text-amber-400 font-mono">Docker &amp; Compose</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span>Branch: {config.branch}</span>
            <span aria-hidden="true">·</span>
            <span>Port: {config.hostPort} &rarr; {config.appPort}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Zero-Downtime Rollout</span>
          </div>
        </div>

        {/* Quick Navigation Bar (Always visible on all screen sizes and mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/60 no-scrollbar">
          <button
            onClick={() => setActiveSection('roadmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'roadmap'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>

          <button
            onClick={() => setActiveSection('steps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'steps'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Step-by-Step</span>
          </button>

          <button
            onClick={() => setActiveSection('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'simulator'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Simulator</span>
          </button>

          {/* Direct 1-Click: CloudWatch Resource Health Monitor */}
          <button
            onClick={handleOpenMonitoring}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'aws-suite' && awsSuiteSubTab === 'monitoring'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-emerald-300 hover:bg-slate-850 hover:text-emerald-200 border border-emerald-500/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">CloudWatch Health Monitor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>

          {/* Direct 1-Click: EC2 Monthly Cost Calculator */}
          <button
            onClick={handleOpenCostCalculator}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'aws-suite' && awsSuiteSubTab === 'cost-calculator'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-amber-300 hover:bg-slate-850 hover:text-amber-200 border border-amber-500/40'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">EC2 Cost Calculator</span>
          </button>

          <button
            onClick={() => {
              setAwsSuiteSubTab('iac');
              setActiveSection('aws-suite');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'aws-suite' && awsSuiteSubTab !== 'monitoring' && awsSuiteSubTab !== 'cost-calculator'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AWS Cloud &amp; IaC</span>
          </button>

          <button
            onClick={() => setActiveSection('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'config'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Code &amp; Configs</span>
          </button>

          <button
            onClick={() => setActiveSection('troubleshoot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'troubleshoot'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Troubleshooting</span>
          </button>

          <button
            onClick={() => setActiveSection('interview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'interview'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Interview Prep</span>
          </button>
        </div>

        {/* View Switcher based on Active Section */}
        {activeSection === 'roadmap' && (
          <ArchitectureDiagram
            language={language}
            onSelectStep={handleSelectStepFromArchitecture}
          />
        )}

        {activeSection === 'steps' && (
          <StepByStepGuide
            language={language}
            onOpenSimulator={() => setActiveSection('simulator')}
            onOpenConfig={() => setActiveSection('config')}
            initialStepId={selectedInitialStep}
          />
        )}

        {activeSection === 'simulator' && (
          <PipelineSimulator config={config} language={language} />
        )}

        {activeSection === 'aws-suite' && (
          <AwsAdvancedSuite
            config={config}
            setConfig={setConfig}
            language={language}
            initialSubTab={awsSuiteSubTab}
          />
        )}

        {activeSection === 'config' && (
          <ConfigGenerator
            config={config}
            setConfig={setConfig}
            language={language}
          />
        )}

        {activeSection === 'troubleshoot' && (
          <TroubleshootingGuide language={language} />
        )}

        {activeSection === 'interview' && (
          <InterviewResumeGuide language={language} />
        )}
      </main>

      {/* Footer conforming to constitution */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-slate-400">
              AWS EC2 CI/CD Deployment Project Blueprint
            </span>
            <span aria-hidden="true">·</span>
            <span>Docker + GitHub Actions Automation</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <button
              onClick={() => setActiveSection('steps')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Step-by-Step
            </button>
            <button
              onClick={() => setActiveSection('simulator')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Live Simulator
            </button>
            <button
              onClick={() => setActiveSection('aws-suite')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              AWS Cloud &amp; IaC
            </button>
            <button
              onClick={() => setActiveSection('config')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Get Files (.zip)
            </button>
            <button
              onClick={() => setActiveSection('interview')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Resume Prep
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
