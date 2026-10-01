import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Server,
  Activity,
  GitCommit,
  Layers,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { ProjectConfig, LanguageMode } from '../types/pipeline';

interface PipelineSimulatorProps {
  config: ProjectConfig;
  language: LanguageMode;
}

interface StageStatus {
  id: string;
  name: string;
  duration: string;
  status: 'pending' | 'running' | 'success' | 'failed';
}

const INITIAL_STAGES: StageStatus[] = [
  { id: 'trigger', name: 'GitHub Webhook / Push Trigger', duration: '2s', status: 'pending' },
  { id: 'test', name: 'CI: npm ci && npm test', duration: '5s', status: 'pending' },
  { id: 'docker-build', name: 'Docker Multi-stage Build & Tag', duration: '8s', status: 'pending' },
  { id: 'docker-push', name: 'Docker Hub Registry Push', duration: '6s', status: 'pending' },
  { id: 'ssh-deploy', name: 'CD: SSH Handshake to AWS EC2', duration: '4s', status: 'pending' },
  { id: 'container-rollout', name: 'Docker Pull & Zero-Downtime Run', duration: '5s', status: 'pending' },
  { id: 'healthcheck', name: 'Healthcheck: curl /health', duration: '3s', status: 'pending' },
];

export const PipelineSimulator: React.FC<PipelineSimulatorProps> = ({
  config,
  language,
}) => {
  const [stages, setStages] = useState<StageStatus[]>(INITIAL_STAGES);
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [failMode, setFailMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'server'>('terminal');
  const [logs, setLogs] = useState<string[]>([]);
  const [deployedVersion, setDeployedVersion] = useState<string>('1.0.0');
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(142);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Keep uptime ticking when server is healthy
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const runSimulation = (shouldFail: boolean = false, version: string = '1.1.0') => {
    if (isRunning) return;

    setIsRunning(true);
    setFailMode(shouldFail);
    setPipelineState('running');
    setLogs([
      `⚡ [CI/CD Event] Commit pushed to origin/${config.branch} by developer`,
      `📦 Repository: ${config.dockerHubUsername}/${config.appName}`,
      `🏷️ Commit: 9f4b7a1 ("feat: release v${version}")`,
      `============================================================`,
    ]);

    // Reset stages
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'pending' })));

    let currentStep = 0;

    const executeStage = () => {
      if (currentStep >= INITIAL_STAGES.length) {
        setIsRunning(false);
        setPipelineState('success');
        setDeployedVersion(version);
        addLog('🎉 [SUCCESS] Pipeline complete! Application updated on AWS EC2.');
        addLog(`🌐 Live response verified at http://54.210.12.34:${config.hostPort}`);
        return;
      }

      const stage = INITIAL_STAGES[currentStep];

      // Mark running
      setStages((prev) =>
        prev.map((s, idx) => (idx === currentStep ? { ...s, status: 'running' } : s))
      );

      // Log stage details
      if (stage.id === 'trigger') {
        addLog(`▶ [Job: Webhook] Actions runner assigned: ubuntu-latest (Hosted VM)`);
        addLog(`✔ Node.js 20 environment initialized in 1.4s`);
      } else if (stage.id === 'test') {
        addLog(`▶ [Job: Test] Running "npm ci"... added 14 packages in 0.9s`);
        if (shouldFail) {
          setTimeout(() => {
            addLog(`✖ [FAIL] 1 test failed: "AssertionError: expected 500 to equal 200"`);
            addLog(`🚨 Process exited with code 1. Deployment aborted!`);
            setStages((prev) =>
              prev.map((s, idx) => (idx === currentStep ? { ...s, status: 'failed' } : s))
            );
            setIsRunning(false);
            setPipelineState('failed');
          }, 1500);
          return;
        }
        addLog(`✔ npm test: All unit tests passed (3 suites, 12 tests)`);
      } else if (stage.id === 'docker-build') {
        addLog(`▶ [Job: Build] docker buildx build --platform linux/amd64 -t ${config.dockerHubUsername}/${config.appName}:latest .`);
        addLog(`  => [internal] load build definition from Dockerfile`);
        addLog(`  => [builder] copying package.json and running npm ci`);
        addLog(`  => [runner] minimal alpine image ready (size: 64MB)`);
      } else if (stage.id === 'docker-push') {
        addLog(`▶ [Job: Push] Authenticating with Docker Hub token...`);
        addLog(`  => Pushing image layer 7a3c89... 100%`);
        addLog(`  => Tagged as ${config.dockerHubUsername}/${config.appName}:latest`);
      } else if (stage.id === 'ssh-deploy') {
        addLog(`▶ [Job: Deploy] Initiating SSH connection to ec2-user@54.210.12.34:22...`);
        addLog(`✔ SSH Handshake successful using RSA Key authentication`);
      } else if (stage.id === 'container-rollout') {
        addLog(`▶ [EC2 Script] docker pull ${config.dockerHubUsername}/${config.appName}:latest`);
        addLog(`  => docker stop ${config.appName} (graceful SIGTERM)`);
        addLog(`  => docker run -d --name ${config.appName} -p ${config.hostPort}:${config.appPort} ${config.dockerHubUsername}/${config.appName}:latest`);
        addLog(`✔ Container started with ID: 4cb89d91fa2`);
      } else if (stage.id === 'healthcheck') {
        addLog(`▶ [Verification] curl -f http://localhost:${config.hostPort}${config.healthEndpoint}`);
        addLog(`  => HTTP 200 OK {"status":"healthy","uptime":${uptimeSeconds}}`);
        addLog(`✔ Health check verified. Zero-downtime rollout completed.`);
      }

      // Schedule next stage
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s, idx) => (idx === currentStep ? { ...s, status: 'success' } : s))
        );
        currentStep++;
        executeStage();
      }, 1400);
    };

    executeStage();
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setPipelineState('idle');
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'pending' })));
    setLogs([
      `Simulator reset to standby state.`,
      `Ready to trigger pipeline execution on commit push.`,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <span>REAL-TIME ENGINE</span>
            <span>·</span>
            <span>INTERACTIVE CI/CD SIMULATOR</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            AWS EC2 Live Deployment Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {language === 'hinglish'
              ? 'Yahan aap real GitHub Actions aur AWS EC2 deployment ka live simulation chala sakte ho. Dekho kaise build, push aur healthcheck execute hota hai.'
              : 'Trigger a simulated code push to watch GitHub Actions compile Docker images, dispatch SSH keys to AWS EC2, and verify zero-downtime rollout.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => runSimulation(false, '1.2.0')}
            disabled={isRunning}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Trigger Push (Success)</span>
          </button>

          <button
            onClick={() => runSimulation(true, '1.2.1-broken')}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Simulate Failure</span>
          </button>

          <button
            onClick={resetSimulation}
            disabled={isRunning}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            title="Reset Simulator"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pipeline Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
          pipelineState === 'running'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : pipelineState === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : pipelineState === 'failed'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-3">
          {pipelineState === 'running' && (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          )}
          {pipelineState === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          {pipelineState === 'failed' && (
            <XCircle className="w-4 h-4 text-rose-400" />
          )}
          {pipelineState === 'idle' && (
            <GitCommit className="w-4 h-4 text-slate-500" />
          )}
          <span>
            {pipelineState === 'running' && 'Pipeline Execution in Progress: Deploying to AWS EC2...'}
            {pipelineState === 'success' && 'Deployment Successful! Verified HTTP 200 OK on EC2 instance.'}
            {pipelineState === 'failed' && 'Deployment Aborted! Unit tests failed in CI stage.'}
            {pipelineState === 'idle' && 'Pipeline Ready. Click "Trigger Push" above to start.'}
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Target: {config.ec2User}@ec2-instance:80
        </div>
      </div>

      {/* Stage Progression Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {stages.map((stage, idx) => (
          <div
            key={stage.id}
            className={`p-3 rounded-lg border text-left flex flex-col justify-between h-24 transition-all ${
              stage.status === 'running'
                ? 'bg-amber-500/10 border-amber-400/80 shadow-sm'
                : stage.status === 'success'
                ? 'bg-slate-900 border-emerald-500/40 text-emerald-400'
                : stage.status === 'failed'
                ? 'bg-rose-950/20 border-rose-500 text-rose-400'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">0{idx + 1}</span>
              {stage.status === 'running' && (
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              )}
              {stage.status === 'success' && (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              )}
              {stage.status === 'failed' && (
                <XCircle className="w-3 h-3 text-rose-400" />
              )}
              {stage.status === 'pending' && (
                <Clock className="w-3 h-3 text-slate-600" />
              )}
            </div>

            <div className="text-[11px] font-medium leading-tight text-slate-200 mt-1">
              {stage.name}
            </div>

            <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="capitalize">{stage.status}</span>
              <span>{stage.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Area: Terminal Logs & Virtual Server Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Terminal Log Console (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-80">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono font-medium text-slate-300">
                GitHub Actions Runner Console
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
          </div>

          <div
            ref={terminalRef}
            className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-y-auto space-y-1 selection:bg-amber-500/20"
          >
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">
                Awaiting pipeline trigger... Click &ldquo;Trigger Push&rdquo; to simulate live execution.
              </div>
            ) : (
              logs.map((log, index) => {
                let colorClass = 'text-slate-300';
                if (log.includes('[SUCCESS]') || log.includes('✔')) {
                  colorClass = 'text-emerald-400';
                } else if (log.includes('[FAIL]') || log.includes('✖') || log.includes('🚨')) {
                  colorClass = 'text-rose-400';
                } else if (log.includes('▶')) {
                  colorClass = 'text-amber-300';
                } else if (log.includes('===')) {
                  colorClass = 'text-slate-500';
                }

                return (
                  <div key={index} className={`leading-relaxed ${colorClass}`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live EC2 Virtual Instance Status (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/70 rounded-xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AWS EC2 Status
                </span>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HEALTHY
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Instance IP:</span>
                <span className="text-slate-200">54.210.12.34 (Elastic IP)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Container:</span>
                <span className="text-amber-300">{config.appName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Version Tag:</span>
                <span className="text-slate-200">v{deployedVersion}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Port Mapping:</span>
                <span className="text-slate-200">0.0.0.0:{config.hostPort} &rarr; 3000</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Memory Footprint:</span>
                <span className="text-slate-200">42MB / 1024MB</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Docker Engine:</span>
                <span className="text-slate-200">v26.1.4 (Ubuntu 24.04)</span>
              </div>
            </div>
          </div>

          {/* Simulated HTTP 200 response payload */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono">
            <div className="text-slate-500 text-[10px] mb-1">
              GET / &rarr; 200 OK
            </div>
            <pre className="text-emerald-400 overflow-x-auto">
{`{
  "status": "ONLINE",
  "version": "${deployedVersion}",
  "cloud": "AWS EC2",
  "docker": "healthy"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
