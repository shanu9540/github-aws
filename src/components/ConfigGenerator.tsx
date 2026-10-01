import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Sliders,
  FolderTree,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { ProjectConfig, LanguageMode } from '../types/pipeline';
import {
  generateDockerfile,
  generateDockerCompose,
  generateGithubWorkflow,
  generateEc2SetupScript,
  generateServerJs,
  generatePackageJson,
  generateJenkinsfile,
  generateReadme,
} from '../data/projectData';
import { exportProjectZip } from '../utils/zipExporter';

interface ConfigGeneratorProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  language: LanguageMode;
}

export const ConfigGenerator: React.FC<ConfigGeneratorProps> = ({
  config,
  setConfig,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<string>('github-actions');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  const filesMap: Record<
    string,
    { filename: string; path: string; content: string; language: string; badge: string }
  > = {
    'github-actions': {
      filename: 'deploy.yml',
      path: '.github/workflows/deploy.yml',
      content: generateGithubWorkflow(config),
      language: 'yaml',
      badge: 'GitHub Actions',
    },
    dockerfile: {
      filename: 'Dockerfile',
      path: 'Dockerfile',
      content: generateDockerfile(config),
      language: 'dockerfile',
      badge: 'Docker',
    },
    'docker-compose': {
      filename: 'docker-compose.yml',
      path: 'docker-compose.yml',
      content: generateDockerCompose(config),
      language: 'yaml',
      badge: 'Orchestration',
    },
    'setup-ec2': {
      filename: 'setup-ec2.sh',
      path: 'setup-ec2.sh',
      content: generateEc2SetupScript(config),
      language: 'bash',
      badge: 'AWS EC2 Script',
    },
    'server-js': {
      filename: 'server.js',
      path: 'server.js',
      content: generateServerJs(config),
      language: 'javascript',
      badge: 'Node.js Express',
    },
    'package-json': {
      filename: 'package.json',
      path: 'package.json',
      content: generatePackageJson(config),
      language: 'json',
      badge: 'Dependencies',
    },
    jenkinsfile: {
      filename: 'Jenkinsfile',
      path: 'Jenkinsfile',
      content: generateJenkinsfile(config),
      language: 'groovy',
      badge: 'Jenkins Alternative',
    },
    readme: {
      filename: 'README.md',
      path: 'README.md',
      content: generateReadme(config),
      language: 'markdown',
      badge: 'Documentation',
    },
  };

  const currentFile = filesMap[activeTab] || filesMap['github-actions'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportProjectZip(config);
    } finally {
      setDownloading(false);
    }
  };

  const lineCount = currentFile.content.split('\n').length;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <span>PRODUCTION CONFIGURATOR</span>
            <span>·</span>
            <span>ZERO BOILERPLATE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Code &amp; Configuration Generator
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {language === 'hinglish'
              ? 'Apne project ke details (repo name, docker username, ports) enter karo, saare scripts aur configuration files automatically update ho jayenge.'
              : 'Customize application parameters below. All GitHub Actions workflows, Dockerfiles, and EC2 provision scripts dynamically re-render in real-time.'}
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{downloading ? 'Packing .ZIP...' : 'Download Full Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Parameter Customizer Bar */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Dynamic Project Variables</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              App Name
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, appName: e.target.value }))
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded focus:border-amber-400 focus:outline-none text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Docker Hub User
            </label>
            <input
              type="text"
              value={config.dockerHubUsername}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  dockerHubUsername: e.target.value,
                }))
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded focus:border-amber-400 focus:outline-none text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Host Port (EC2)
            </label>
            <input
              type="number"
              value={config.hostPort}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  hostPort: parseInt(e.target.value, 10) || 80,
                }))
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded focus:border-amber-400 focus:outline-none text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Container Port
            </label>
            <input
              type="number"
              value={config.appPort}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  appPort: parseInt(e.target.value, 10) || 3000,
                }))
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded focus:border-amber-400 focus:outline-none text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              EC2 User
            </label>
            <input
              type="text"
              value={config.ec2User}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, ec2User: e.target.value }))
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded focus:border-amber-400 focus:outline-none text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Git Branch
            </label>
            <input
              type="text"
              value={config.branch}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, branch: e.target.value }))
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded focus:border-amber-400 focus:outline-none text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Main Code View Area */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        {/* File Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-slate-800 bg-slate-900/80 px-2 py-1 gap-1">
          {Object.entries(filesMap).map(([key, file]) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-850 text-amber-300 font-semibold border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file.filename}</span>
              </button>
            );
          })}
        </div>

        {/* File Meta Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/40 border-b border-slate-850 text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-400">
            <span className="text-amber-400 font-medium">
              {currentFile.path}
            </span>
            <span>·</span>
            <span>{lineCount} lines</span>
            <span>·</span>
            <span className="text-slate-500">{currentFile.badge}</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Box with numbered lines */}
        <div className="p-4 overflow-x-auto max-h-[520px] font-mono text-xs text-slate-300 leading-relaxed selection:bg-amber-500/20">
          <pre className="flex">
            {/* Line numbers */}
            <div className="select-none text-slate-600 text-right pr-4 font-mono">
              {currentFile.content.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Actual code */}
            <code className="text-slate-200 flex-1">{currentFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
