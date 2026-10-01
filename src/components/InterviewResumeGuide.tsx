import React, { useState } from 'react';
import {
  Award,
  FileText,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { RESUME_BULLETS, INTERVIEW_QUESTIONS } from '../data/projectData';
import { LanguageMode } from '../types/pipeline';

interface InterviewResumeGuideProps {
  language: LanguageMode;
}

export const InterviewResumeGuide: React.FC<InterviewResumeGuideProps> = ({
  language,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const copyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllBullets = () => {
    const text = RESUME_BULLETS.map((b) => `• ${b}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Target Project Outcome Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-400/40 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Official Project Outcome Requirement</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          &ldquo;Implemented CI/CD pipeline for cloud deployment.&rdquo;
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          {language === 'hinglish'
            ? 'Aapne is project me GitHub Actions, Docker containers aur AWS EC2 ka automated infrastructure banaya hai. Yeh skills DevOps, Cloud Engineer aur Full Stack roles ke resume me sabse high-demand hain.'
            : 'You have architected and deployed an end-to-end continuous delivery pipeline integrating GitHub Actions, Docker container virtualization, and AWS EC2 cloud infrastructure.'}
        </p>
      </div>

      {/* Resume Bullet Points Section */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>RESUME &amp; LINKEDIN READY BULLETS</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Production-Grade Impact Statements
            </h3>
          </div>

          <button
            onClick={copyAllBullets}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>All Bullets Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All Bullets</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-2.5">
          {RESUME_BULLETS.map((bullet, idx) => {
            const isCopied = copiedIndex === idx;
            return (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {bullet}
                  </p>
                </div>
                <button
                  onClick={() => copyBullet(bullet, idx)}
                  className="text-slate-500 hover:text-amber-300 transition-colors p-1 shrink-0 cursor-pointer"
                  title="Copy bullet"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Interview Questions & Technical Answers */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>INTERVIEW PREPARATION</span>
          </div>
          <h3 className="text-base font-bold text-white mt-0.5">
            Top Technical Questions on this AWS CI/CD Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'hinglish'
              ? 'Interviews me interviewer aapse pipeline architecture, failure recovery aur Docker decisions ke bare me poochenge. Ye answers yaad rakhein.'
              : 'Detailed answers explaining architectural tradeoffs, security considerations, and rollback strategies.'}
          </p>
        </div>

        <div className="space-y-3">
          {INTERVIEW_QUESTIONS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer gap-3 hover:bg-slate-900/40 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-200">
                    Q{idx + 1}: {item.question}
                  </span>
                  <span className="text-slate-400 shrink-0">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 bg-slate-900/20">
                    <span className="text-amber-400 font-semibold block mb-1">
                      Recommended Answer:
                    </span>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
