import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Terminal,
  FileCode,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { PIPELINE_STEPS } from '../data/projectData';
import { LanguageMode, PipelineStep } from '../types/pipeline';

interface StepByStepGuideProps {
  language: LanguageMode;
  onOpenSimulator: () => void;
  onOpenConfig: () => void;
  initialStepId?: string;
}

export const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  language,
  onOpenSimulator,
  onOpenConfig,
  initialStepId,
}) => {
  const [activeStepId, setActiveStepId] = useState<string>(
    initialStepId || 'step-1'
  );
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(
    () => {
      try {
        const saved = localStorage.getItem('aws_pipeline_checklist');
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        'aws_pipeline_checklist',
        JSON.stringify(completedItems)
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [completedItems]);

  const toggleChecklist = (key: string) => {
    setCompletedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Calculate overall completion progress
  const totalTasks = PIPELINE_STEPS.reduce(
    (acc, step) => acc + step.checklist.length,
    0
  );
  const finishedTasks = Object.values(completedItems).filter(Boolean).length;
  const progressPercent = Math.min(
    100,
    Math.round((finishedTasks / totalTasks) * 100)
  );

  const activeStep =
    PIPELINE_STEPS.find((s) => s.id === activeStepId) || PIPELINE_STEPS[0];

  return (
    <div className="space-y-6">
      {/* Roadmap Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <span>ACTIONABLE ROADMAP</span>
            <span>·</span>
            <span>7 MILESTONES TO PRODUCTION</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Step-by-Step Implementation Guide
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {language === 'hinglish'
              ? 'Har ek step ko sequentially follow karo. Saare commands aur configurations ready hain. Task complete hone par check mark karte jao.'
              : 'Execute each milestone in sequence. Use verified commands, copy configuration files, and track your verified progress.'}
          </p>
        </div>

        {/* Progress Tracker Widget */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 min-w-[220px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300">Project Progress</span>
            <span className="font-mono text-amber-400 font-bold">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 text-right">
            {finishedTasks} of {totalTasks} tasks checked
          </div>
        </div>
      </div>

      {/* Main Grid: Step List on Left, Active Step Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Navigation Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          {PIPELINE_STEPS.map((step) => {
            const isActive = activeStepId === step.id;
            const stepTasks = step.checklist.map((_, i) => `${step.id}-${i}`);
            const completedCount = stepTasks.filter(
              (id) => completedItems[id]
            ).length;
            const isStepComplete = completedCount === step.checklist.length;

            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-400/80 text-white shadow-sm'
                    : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                    isStepComplete
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isActive
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isStepComplete ? '✓' : step.number}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500">
                      Step {step.number}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {step.estimatedTime}
                    </span>
                  </div>
                  <h4
                    className={`text-xs font-semibold truncate mt-0.5 ${
                      isActive ? 'text-amber-300' : 'text-slate-200'
                    }`}
                  >
                    {language === 'hinglish' ? step.titleHi : step.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {completedCount}/{step.checklist.length} done
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step In-Depth Content Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
          {/* Header of Active Step */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  MILESTONE {activeStep.number}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-mono text-slate-400">
                  Estimated: {activeStep.estimatedTime}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">
                Difficulty: {activeStep.difficulty}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              {language === 'hinglish' ? activeStep.titleHi : activeStep.title}
            </h3>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {language === 'hinglish'
                ? activeStep.summaryHi
                : activeStep.summary}
            </p>
          </div>

          {/* Interactive Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step Checklist & Milestones</span>
            </h4>
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              {activeStep.checklist.map((item, index) => {
                const itemKey = `${activeStep.id}-${index}`;
                const isChecked = !!completedItems[itemKey];

                return (
                  <button
                    key={itemKey}
                    onClick={() => toggleChecklist(itemKey)}
                    className="w-full flex items-start gap-3 p-2 rounded hover:bg-slate-900/60 transition-colors cursor-pointer text-left group"
                  >
                    <span className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                      )}
                    </span>
                    <span
                      className={`text-xs transition-colors leading-relaxed ${
                        isChecked
                          ? 'line-through text-slate-500'
                          : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terminal Commands to Run (if any) */}
          {activeStep.commands && activeStep.commands.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Commands to Execute</span>
              </h4>
              <div className="space-y-3">
                {activeStep.commands.map((cmd, i) => {
                  const cmdKey = `cmd-${activeStep.id}-${i}`;
                  const isCopied = copiedCode === cmdKey;

                  return (
                    <div
                      key={cmdKey}
                      className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-300">
                          {cmd.label}
                        </span>
                        <button
                          onClick={() => copyToClipboard(cmd.code, cmdKey)}
                          className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-mono"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      {cmd.description && (
                        <div className="px-3.5 py-1 bg-slate-900/40 text-[11px] text-slate-400 border-b border-slate-850">
                          {cmd.description}
                        </div>
                      )}
                      <pre className="p-3 font-mono text-xs text-amber-300 overflow-x-auto selection:bg-amber-500/30">
                        <code>{cmd.code}</code>
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reference Files (if any) */}
          {activeStep.files && activeStep.files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>Files Created in this Step</span>
                </h4>
                <button
                  onClick={onOpenConfig}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Customize in Config Generator</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {activeStep.files.map((file, i) => {
                  const fileKey = `file-${activeStep.id}-${i}`;
                  const isCopied = copiedCode === fileKey;

                  return (
                    <div
                      key={fileKey}
                      className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px]">
                        <span className="font-mono text-amber-300 font-semibold">
                          {file.path}
                        </span>
                        <button
                          onClick={() => copyToClipboard(file.code, fileKey)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                        <code>{file.code}</code>
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Takeaway Box */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">
                {language === 'hinglish' ? 'Khas Baat (Takeaway): ' : 'DevOps Rule: '}
              </span>
              <span>
                {language === 'hinglish'
                  ? activeStep.keyTakeawayHi
                  : activeStep.keyTakeaway}
              </span>
            </div>
          </div>

          {/* Next Step / Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {activeStep.number !== '01' ? (
              <button
                onClick={() => {
                  const currentIndex = PIPELINE_STEPS.findIndex(
                    (s) => s.id === activeStep.id
                  );
                  if (currentIndex > 0) {
                    setActiveStepId(PIPELINE_STEPS[currentIndex - 1].id);
                  }
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-md transition-colors cursor-pointer"
              >
                ← Previous Step
              </button>
            ) : (
              <div />
            )}

            {activeStep.number !== '07' ? (
              <button
                onClick={() => {
                  const currentIndex = PIPELINE_STEPS.findIndex(
                    (s) => s.id === activeStep.id
                  );
                  if (currentIndex < PIPELINE_STEPS.length - 1) {
                    setActiveStepId(PIPELINE_STEPS[currentIndex + 1].id);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Next: Step 0{parseInt(activeStep.number, 10) + 1}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onOpenSimulator}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Test in Live Simulator</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
