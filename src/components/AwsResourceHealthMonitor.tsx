import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Server,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  Cpu,
  HardDrive,
  Network,
  Radio,
  Clock,
  ExternalLink,
  Code2,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { ProjectConfig, LanguageMode } from '../types/pipeline';

interface AwsResourceHealthMonitorProps {
  config: ProjectConfig;
  language: LanguageMode;
}

interface MetricPoint {
  time: string;
  value: number;
}

export const AwsResourceHealthMonitor: React.FC<AwsResourceHealthMonitorProps> = ({
  config,
  language,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [loadScenario, setLoadScenario] = useState<'nominal' | 'spike' | 'leak'>('nominal');
  const [cpuHistory, setCpuHistory] = useState<MetricPoint[]>([
    { time: '09:40', value: 18 },
    { time: '09:41', value: 22 },
    { time: '09:42', value: 19 },
    { time: '09:43', value: 25 },
    { time: '09:44', value: 21 },
    { time: '09:45', value: 24 },
    { time: '09:46', value: 22 },
    { time: '09:47', value: 28 },
    { time: '09:48', value: 23 },
    { time: '09:49', value: 20 },
  ]);

  const [ramHistory, setRamHistory] = useState<MetricPoint[]>([
    { time: '09:40', value: 34 },
    { time: '09:41', value: 35 },
    { time: '09:42', value: 34 },
    { time: '09:43', value: 36 },
    { time: '09:44', value: 36 },
    { time: '09:45', value: 37 },
    { time: '09:46', value: 38 },
    { time: '09:47', value: 37 },
    { time: '09:48', value: 38 },
    { time: '09:49', value: 39 },
  ]);

  const [networkIn, setNetworkIn] = useState<number>(48); // KB/s
  const [networkOut, setNetworkOut] = useState<number>(142); // KB/s
  const [alarmCpuState, setAlarmCpuState] = useState<'OK' | 'ALARM'>('OK');
  const [alarmRamState, setAlarmRamState] = useState<'OK' | 'ALARM'>('OK');
  const [detailedMonitoring, setDetailedMonitoring] = useState<boolean>(true);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  const [alarmLogs, setAlarmLogs] = useState<
    { id: string; time: string; type: 'ALARM' | 'OK'; message: string }[]
  >([
    {
      id: 'init-1',
      time: '09:40:02',
      type: 'OK',
      message: 'CloudWatch Alarm [EC2-High-CPU] transitioned to OK (Threshold: 80%)',
    },
  ]);

  // Periodic metric updater
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Generate next CPU value based on scenario
      setCpuHistory((prev) => {
        let nextVal = 20;
        const last = prev[prev.length - 1]?.value || 20;

        if (loadScenario === 'spike') {
          // Stay between 84% and 94%
          nextVal = Math.min(96, Math.max(82, last + (Math.random() * 8 - 4)));
        } else if (loadScenario === 'leak') {
          // Fluctuating moderate CPU
          nextVal = Math.min(65, Math.max(30, last + (Math.random() * 6 - 3)));
        } else {
          // Nominal 15-28%
          nextVal = Math.min(32, Math.max(14, last + (Math.random() * 6 - 3)));
        }

        const rounded = Math.round(nextVal * 10) / 10;
        const newArr = [...prev.slice(1), { time: timeStr, value: rounded }];

        // Check alarm condition: CPU >= 80%
        if (rounded >= 80) {
          if (alarmCpuState !== 'ALARM') {
            setAlarmCpuState('ALARM');
            setAlarmLogs((logs) => [
              {
                id: `${Date.now()}-cpu-alarm`,
                time: timeStr,
                type: 'ALARM',
                message: `ALERT: CPUUtilization was ${rounded}% >= 80% for period. SNS Notification dispatched to team!`,
              },
              ...logs.slice(0, 5),
            ]);
          }
        } else {
          if (alarmCpuState === 'ALARM') {
            setAlarmCpuState('OK');
            setAlarmLogs((logs) => [
              {
                id: `${Date.now()}-cpu-ok`,
                time: timeStr,
                type: 'OK',
                message: `RESOLVED: CPUUtilization returned to nominal (${rounded}% < 80%). Alarm cleared.`,
              },
              ...logs.slice(0, 5),
            ]);
          }
        }

        return newArr;
      });

      // Generate next RAM value based on scenario
      setRamHistory((prev) => {
        let nextVal = 38;
        const last = prev[prev.length - 1]?.value || 38;

        if (loadScenario === 'leak') {
          // Memory climbing upward
          nextVal = Math.min(95, last + Math.random() * 2.5);
        } else if (loadScenario === 'spike') {
          // High load memory
          nextVal = Math.min(68, Math.max(50, last + (Math.random() * 4 - 2)));
        } else {
          // Nominal 35-42%
          nextVal = Math.min(44, Math.max(34, last + (Math.random() * 3 - 1.5)));
        }

        const rounded = Math.round(nextVal * 10) / 10;
        const newArr = [...prev.slice(1), { time: timeStr, value: rounded }];

        if (rounded >= 85) {
          if (alarmRamState !== 'ALARM') {
            setAlarmRamState('ALARM');
            setAlarmLogs((logs) => [
              {
                id: `${Date.now()}-ram-alarm`,
                time: timeStr,
                type: 'ALARM',
                message: `CRITICAL: MemoryUtilization reached ${rounded}% >= 85%. Out-Of-Memory killer risk!`,
              },
              ...logs.slice(0, 5),
            ]);
          }
        } else if (alarmRamState === 'ALARM' && rounded < 80) {
          setAlarmRamState('OK');
          setAlarmLogs((logs) => [
            {
              id: `${Date.now()}-ram-ok`,
              time: timeStr,
              type: 'OK',
              message: `RECOVERED: Memory usage settled back to ${rounded}%. Alarm OK.`,
            },
            ...logs.slice(0, 5),
          ]);
        }

        return newArr;
      });

      // Update Network stats
      if (loadScenario === 'spike') {
        setNetworkIn(Math.round(280 + Math.random() * 80));
        setNetworkOut(Math.round(820 + Math.random() * 150));
      } else {
        setNetworkIn(Math.round(40 + Math.random() * 20));
        setNetworkOut(Math.round(120 + Math.random() * 40));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, loadScenario, alarmCpuState, alarmRamState]);

  const currentCpu = cpuHistory[cpuHistory.length - 1]?.value || 0;
  const currentRam = ramHistory[ramHistory.length - 1]?.value || 0;

  // Chart rendering helper: generate SVG path for a 0-100 range in viewBox 0 0 300 80
  const generateSvgPath = (points: MetricPoint[], height: number = 70, width: number = 320) => {
    if (points.length === 0) return '';
    const stepX = width / (points.length - 1);
    const coordinates = points.map((p, idx) => {
      const x = idx * stepX;
      // y inverted: 100% -> 0, 0% -> height
      const y = height - (p.value / 100) * height;
      return `${x},${y}`;
    });

    return `M ${coordinates.join(' L ')}`;
  };

  const copyCliCommand = () => {
    const cmd = `aws cloudwatch put-metric-data \\\n  --namespace "CWAgent" \\\n  --metric-name CPUUtilization \\\n  --dimensions InstanceId=i-09f4b7a123ec2 \\\n  --value ${currentCpu} \\\n  --unit Percent`;
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>AWS CLOUDWWATCH TELEMETRY</span>
            <span>·</span>
            <span>REAL-TIME RESOURCE HEALTH MONITOR</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            AWS EC2 &amp; Container Live Metrics Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {language === 'hinglish'
              ? 'Ye dashboard AWS CloudWatch Agent ka live simulation hai. Yahan aap real-time CPU, RAM aur Network metrics dekh sakte hain aur traffic spike simulate karke alarms test kar sakte hain.'
              : 'Interactive CloudWatch observability console tracking EC2 instance health, CloudWatch unified agent metrics, and threshold alarm transitions.'}
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
              isRunning
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'bg-amber-400 text-slate-950 font-bold'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Live Streaming (2s)</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>Stream Paused</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setLoadScenario('nominal');
              setAlarmCpuState('OK');
              setAlarmRamState('OK');
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded transition-colors cursor-pointer"
            title="Reset metrics to nominal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EC2 Instance Info Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800">
        <div>
          <span className="text-slate-500 block text-[10px]">Instance ID:</span>
          <span className="text-slate-200 font-semibold">i-09f4b7a123ec2</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Type / Arch:</span>
          <span className="text-amber-400">{config.instanceType || 't3.micro'} (x86_64)</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Region / AZ:</span>
          <span className="text-slate-200">{config.awsRegion || 'us-east-1'}a</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Status Checks:</span>
          <span className="text-emerald-400 font-bold">2/2 Passed</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">CloudWatch Resolution:</span>
          <span className="text-slate-200">1-Min Detailed</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Overall State:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      {/* Scenario Trigger Bar (Interactive Traffic Injection) */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate CloudWatch Incident Scenarios</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Current Scenario: <span className="text-amber-400 font-semibold uppercase">{loadScenario}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={() => setLoadScenario('nominal')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              loadScenario === 'nominal'
                ? 'bg-emerald-500/10 border-emerald-400 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">1. Nominal Traffic</span>
              {loadScenario === 'nominal' && <span className="text-[10px] text-emerald-400">Active</span>}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Normal web requests. CPU stays steady at 15–28%, memory at 35%. All alarms OK.
            </p>
          </button>

          <button
            onClick={() => setLoadScenario('spike')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              loadScenario === 'spike'
                ? 'bg-rose-500/10 border-rose-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400">2. High Traffic Spike</span>
              {loadScenario === 'spike' && <span className="text-[10px] text-rose-400">Active</span>}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Surge in API requests. CPU spikes &gt; 80%, tripping the CloudWatch Alarm &amp; SNS alert!
            </p>
          </button>

          <button
            onClick={() => setLoadScenario('leak')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              loadScenario === 'leak'
                ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">3. Memory Leak</span>
              {loadScenario === 'leak' && <span className="text-[10px] text-amber-400">Active</span>}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Container leaks RAM continuously until reaching the 85% OOM risk threshold.
            </p>
          </button>
        </div>
      </div>

      {/* Main Metrics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Metric 1: CPU Utilization */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  AWS/EC2 · CPUUtilization
                </h3>
                <span className="text-[10px] text-slate-500">Unit: Percent (%) · Average</span>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-2xl font-extrabold font-mono ${
                  currentCpu >= 80 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {currentCpu}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Threshold: 80.0%
              </span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative h-24 bg-slate-900/50 rounded-lg p-2 overflow-hidden border border-slate-850">
            {/* 80% Threshold reference line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-rose-500/60 pointer-events-none"
              style={{ top: `${(1 - 80 / 100) * 100}%` }}
            >
              <span className="absolute right-1 -top-3 text-[9px] font-mono text-rose-400">
                80% ALARM LINE
              </span>
            </div>

            <svg viewBox="0 0 320 70" className="w-full h-full overflow-visible">
              {/* Grid lines */}
              <line x1="0" y1="35" x2="320" y2="35" stroke="#334155" strokeDasharray="3,3" />
              {/* Path line */}
              <path
                d={generateSvgPath(cpuHistory, 60, 320)}
                fill="none"
                stroke={currentCpu >= 80 ? '#f43f5e' : '#fbbf24'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>Min: 14.2%</span>
            <span>Max: {loadScenario === 'spike' ? '92.4%' : '28.1%'}</span>
            <span className={alarmCpuState === 'ALARM' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              Status: {alarmCpuState}
            </span>
          </div>
        </div>

        {/* Metric 2: Memory Utilization */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  CWAgent · mem_used_percent
                </h3>
                <span className="text-[10px] text-slate-500">Unit: Percent (%) · Linux CWAgent</span>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-2xl font-extrabold font-mono ${
                  currentRam >= 85 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {currentRam}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Threshold: 85.0%
              </span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative h-24 bg-slate-900/50 rounded-lg p-2 overflow-hidden border border-slate-850">
            {/* 85% Threshold reference line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-rose-500/60 pointer-events-none"
              style={{ top: `${(1 - 85 / 100) * 100}%` }}
            >
              <span className="absolute right-1 -top-3 text-[9px] font-mono text-rose-400">
                85% ALARM LINE
              </span>
            </div>

            <svg viewBox="0 0 320 70" className="w-full h-full overflow-visible">
              <line x1="0" y1="35" x2="320" y2="35" stroke="#334155" strokeDasharray="3,3" />
              <path
                d={generateSvgPath(ramHistory, 60, 320)}
                fill="none"
                stroke={currentRam >= 85 ? '#f43f5e' : '#10b981'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>Used: {Math.round((currentRam / 100) * 1024)} MB</span>
            <span>Total: 1024 MB (1GB RAM)</span>
            <span className={alarmRamState === 'ALARM' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              Status: {alarmRamState}
            </span>
          </div>
        </div>
      </div>

      {/* Network & CloudWatch Alarms Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Network Throughput Subcard (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Network className="w-4 h-4 text-amber-400" />
              <span>Network I/O (Bytes In / Out)</span>
            </div>

            <div className="space-y-3 mt-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">NetworkIn:</span>
                  <span className="text-white font-bold">{networkIn} KB/s</span>
                </div>
                <span className="text-[10px] text-slate-500">Inbound HTTP traffic</span>
              </div>

              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-855 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">NetworkOut:</span>
                  <span className="text-emerald-400 font-bold">{networkOut} KB/s</span>
                </div>
                <span className="text-[10px] text-slate-500">Express JSON response</span>
              </div>
            </div>
          </div>

          {/* Test CLI command copy */}
          <div className="pt-2">
            <button
              onClick={copyCliCommand}
              className="w-full flex items-center justify-center gap-2 p-2 text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded transition-colors cursor-pointer"
            >
              {copiedCli ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied AWS CLI Command!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy aws cloudwatch put-metric-data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live CloudWatch Alarms History (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                CloudWatch Alarms &amp; SNS Notification Feed
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Target: Amazon SNS topic (arn:aws:sns:us-east-1:...)
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alarmLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 leading-relaxed ${
                  log.type === 'ALARM'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {log.type === 'ALARM' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-400">
                      State Transition: {log.type}
                    </span>
                    <span>{log.time}</span>
                  </div>
                  <div className="mt-0.5">{log.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CloudWatch Concepts Guide (Educational) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>DevOps CloudWatch Fundamentals Explained</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-300">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-white block">1. Hypervisor vs Agent Metrics</span>
            <p className="text-[11px] text-slate-400">
              {language === 'hinglish'
                ? 'AWS Hypervisor sirf CPU aur Network dekh sakta hai. RAM aur Disk usage track karne ke liye EC2 ke andar Amazon CloudWatch Unified Agent install karna padta hai.'
                : 'AWS hypervisors natively track CPU and Network. Memory and disk metrics require the Amazon CloudWatch Agent running inside the Linux guest OS.'}
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-white block">2. Standard vs Detailed Monitoring</span>
            <p className="text-[11px] text-slate-400">
              {language === 'hinglish'
                ? 'Basic monitoring 5-minute interval me data bhejta hai (free). Detailed monitoring 1-minute interval me metric bhejta hai (production ke liye recommended).'
                : 'Basic monitoring polls metrics every 5 minutes at no extra charge. Detailed monitoring publishes data every 1 minute for faster incident detection.'}
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-white block">3. Alarms &amp; Auto-Remediation</span>
            <p className="text-[11px] text-slate-400">
              {language === 'hinglish'
                ? 'Agar CPU lagatar 80% se zyada rahe, toh CloudWatch Alarm trigger hokar Amazon SNS ke zariye team ko email ya Slack notification bhej deta hai.'
                : 'Alarms evaluate consecutive metric datapoints against static thresholds or anomaly detection bands, triggering SNS topics, Lambda scripts, or EC2 auto-recovery.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
