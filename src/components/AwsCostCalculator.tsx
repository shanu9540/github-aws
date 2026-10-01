import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Calculator,
  Check,
  TrendingDown,
  Info,
  Server,
  HardDrive,
  Network,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { ProjectConfig, LanguageMode } from '../types/pipeline';

interface AwsCostCalculatorProps {
  config: ProjectConfig;
  setConfig?: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  language: LanguageMode;
}

interface InstanceSpec {
  type: string;
  family: string;
  vcpu: number;
  memoryGb: number;
  hourlyRateUsd: number;
  freeTierEligible: boolean;
  arch: 'x86_64' | 'arm64 (Graviton2)';
  recommendedFor: string;
}

const INSTANCE_CATALOG: InstanceSpec[] = [
  {
    type: 't2.micro',
    family: 'General Purpose T2',
    vcpu: 1,
    memoryGb: 1,
    hourlyRateUsd: 0.0116,
    freeTierEligible: true,
    arch: 'x86_64',
    recommendedFor: 'AWS Free Tier default, small test microservices',
  },
  {
    type: 't3.nano',
    family: 'General Purpose T3',
    vcpu: 2,
    memoryGb: 0.5,
    hourlyRateUsd: 0.0052,
    freeTierEligible: false,
    arch: 'x86_64',
    recommendedFor: 'Ultra-low cost background workers, proxy jump hosts',
  },
  {
    type: 't3.micro',
    family: 'General Purpose T3',
    vcpu: 2,
    memoryGb: 1,
    hourlyRateUsd: 0.0104,
    freeTierEligible: true,
    arch: 'x86_64',
    recommendedFor: 'Recommended for Free Tier in modern AWS regions',
  },
  {
    type: 't3.small',
    family: 'General Purpose T3',
    vcpu: 2,
    memoryGb: 2,
    hourlyRateUsd: 0.0208,
    freeTierEligible: false,
    arch: 'x86_64',
    recommendedFor: 'Production Docker web app with Nginx + Express',
  },
  {
    type: 't3.medium',
    family: 'General Purpose T3',
    vcpu: 2,
    memoryGb: 4,
    hourlyRateUsd: 0.0416,
    freeTierEligible: false,
    arch: 'x86_64',
    recommendedFor: 'Multi-container Docker Compose + PostgreSQL / Redis',
  },
  {
    type: 't3.large',
    family: 'General Purpose T3',
    vcpu: 2,
    memoryGb: 8,
    hourlyRateUsd: 0.0832,
    freeTierEligible: false,
    arch: 'x86_64',
    recommendedFor: 'High concurrency production workloads, CI runners',
  },
  {
    type: 't4g.micro',
    family: 'Graviton2 ARM',
    vcpu: 2,
    memoryGb: 1,
    hourlyRateUsd: 0.0084,
    freeTierEligible: false,
    arch: 'arm64 (Graviton2)',
    recommendedFor: '19% cheaper than t3.micro with faster ARM CPU performance',
  },
  {
    type: 't4g.small',
    family: 'Graviton2 ARM',
    vcpu: 2,
    memoryGb: 2,
    hourlyRateUsd: 0.0168,
    freeTierEligible: false,
    arch: 'arm64 (Graviton2)',
    recommendedFor: 'Cost-optimized 2GB container host (Best price/performance)',
  },
  {
    type: 'c6i.large',
    family: 'Compute Optimized',
    vcpu: 2,
    memoryGb: 4,
    hourlyRateUsd: 0.085,
    freeTierEligible: false,
    arch: 'x86_64',
    recommendedFor: 'CPU-intensive rendering, machine learning inference',
  },
];

const REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', multiplier: 1.0 },
  { id: 'us-west-2', name: 'US West (Oregon)', multiplier: 1.0 },
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)', multiplier: 1.06 },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)', multiplier: 1.14 },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', multiplier: 1.09 },
];

const PRICING_MODELS = [
  { id: 'on-demand', name: 'On-Demand', discount: 0, desc: 'Pay per hour, no commitment' },
  { id: 'savings-plan', name: '1-Yr Savings Plan', discount: 0.38, desc: 'Commit to 1 year, save ~38%' },
  { id: 'spot', name: 'Spot Instance', discount: 0.70, desc: 'Interruptible capacity, save ~70%' },
];

export const AwsCostCalculator: React.FC<AwsCostCalculatorProps> = ({
  config,
  setConfig,
  language,
}) => {
  const [selectedType, setSelectedType] = useState<string>(
    config.instanceType || 't3.micro'
  );
  const [selectedRegion, setSelectedRegion] = useState<string>(
    config.awsRegion || 'us-east-1'
  );
  const [pricingModel, setPricingModel] = useState<string>('on-demand');
  const [hoursPerDay, setHoursPerDay] = useState<number>(24);
  const [ebsStorageGb, setEbsStorageGb] = useState<number>(20);
  const [dataTransferGb, setDataTransferGb] = useState<number>(10);
  const [hasFreeTier, setHasFreeTier] = useState<boolean>(true);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  const USD_TO_INR = 86.5;

  const currentInstance =
    INSTANCE_CATALOG.find((i) => i.type === selectedType) || INSTANCE_CATALOG[2];

  const currentRegion =
    REGIONS.find((r) => r.id === selectedRegion) || REGIONS[0];

  const currentModel =
    PRICING_MODELS.find((m) => m.id === pricingModel) || PRICING_MODELS[0];

  // Computations
  const totalMonthlyHours = Math.round(hoursPerDay * 30.5);

  const calculation = useMemo(() => {
    const rawHourly = currentInstance.hourlyRateUsd * currentRegion.multiplier;
    const discountedHourly = rawHourly * (1 - currentModel.discount);

    // Compute cost
    let billableHours = totalMonthlyHours;
    let freeTierHoursDiscount = 0;

    if (hasFreeTier && currentInstance.freeTierEligible) {
      freeTierHoursDiscount = Math.min(750, totalMonthlyHours);
      billableHours = Math.max(0, totalMonthlyHours - 750);
    }

    const computeCost = billableHours * discountedHourly;
    const computeSavedByFreeTier = freeTierHoursDiscount * discountedHourly;

    // EBS Cost (gp3: $0.08 per GB-month)
    let billableStorageGb = ebsStorageGb;
    let storageSavedByFreeTier = 0;
    if (hasFreeTier) {
      const freeGb = Math.min(30, ebsStorageGb);
      billableStorageGb = Math.max(0, ebsStorageGb - freeGb);
      storageSavedByFreeTier = freeGb * 0.08;
    }
    const storageCost = billableStorageGb * 0.08;

    // Data Transfer Out ($0.09/GB beyond first 100 GB)
    const billableTransferGb = Math.max(0, dataTransferGb - 100);
    const transferCost = billableTransferGb * 0.09;

    // Static IP: Free when instance is running 24/7, $0.005/hr when stopped
    const stoppedHours = Math.max(0, 732 - totalMonthlyHours);
    const elasticIpCost = stoppedHours * 0.005;

    const totalCost = computeCost + storageCost + transferCost + elasticIpCost;
    const totalSavings = computeSavedByFreeTier + storageSavedByFreeTier;

    return {
      rawHourly,
      discountedHourly,
      computeCost,
      storageCost,
      transferCost,
      elasticIpCost,
      totalCost,
      totalSavings,
      computeSavedByFreeTier,
      storageSavedByFreeTier,
    };
  }, [
    currentInstance,
    currentRegion,
    currentModel,
    hoursPerDay,
    totalMonthlyHours,
    ebsStorageGb,
    dataTransferGb,
    hasFreeTier,
  ]);

  const formatPrice = (usd: number) => {
    if (currency === 'INR') {
      const inr = usd * USD_TO_INR;
      return `₹${inr.toFixed(2)}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const handleApplyToConfig = () => {
    if (setConfig) {
      setConfig((prev) => ({
        ...prev,
        instanceType: currentInstance.type,
        awsRegion: selectedRegion,
      }));
      setAppliedNotification(true);
      setTimeout(() => setAppliedNotification(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Calculator className="w-3.5 h-3.5" />
            <span>FINOPS CLOUD BUDGETING</span>
            <span>·</span>
            <span>AWS EC2 MONTHLY COST CALCULATOR</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Estimate Monthly AWS EC2 Running Costs
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {language === 'hinglish'
              ? 't3.micro, t3.small ya Graviton (t4g) jaise alag-alag instance types select karo aur dekho On-Demand, Savings Plan aur Free Tier ke saath monthly bill kitna aayega.'
              : 'Calculate real-world compute, gp3 EBS storage, and network egress costs with Free Tier deductions and 1-Year Savings Plans.'}
          </p>
        </div>

        {/* Currency Switcher & Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                currency === 'USD'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                currency === 'INR'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              INR (₹)
            </button>
          </div>

          {setConfig && (
            <button
              onClick={handleApplyToConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              {appliedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Applied to Project!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Use {currentInstance.type} in Terraform</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Parameters on Left (7 cols), Total Bill Summary on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          {/* 1. Instance Type Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <span>1. Select EC2 Instance Type</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {INSTANCE_CATALOG.length} types available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {INSTANCE_CATALOG.map((inst) => {
                const isSelected = selectedType === inst.type;
                const monthlyAt24x7 =
                  inst.hourlyRateUsd * currentRegion.multiplier * 732;

                return (
                  <button
                    key={inst.type}
                    onClick={() => setSelectedType(inst.type)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isSelected ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {inst.type}
                      </span>
                      {inst.freeTierEligible && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Free Tier
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                      <span>
                        {inst.vcpu} vCPU · {inst.memoryGb} GB RAM
                      </span>
                      <span className="text-slate-300 font-semibold">
                        {formatPrice(monthlyAt24x7)}/mo
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 truncate mt-1">
                      {inst.recommendedFor}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Region & Pricing Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>AWS Region</span>
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.multiplier > 1.0 ? `(+${Math.round((r.multiplier - 1) * 100)}%)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Payment Plan</span>
              </label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {PRICING_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.discount > 0 ? `-${Math.round(m.discount * 100)}% off` : 'Standard'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Runtime & Storage Sliders */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            {/* Hours per day slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">
                  Instance Active Hours per Day
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {hoursPerDay} hrs/day ({totalMonthlyHours} hrs/month)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                <span>8 hrs (Work hours)</span>
                <span>12 hrs (Extended)</span>
                <span>24 hrs (Production 24/7)</span>
              </div>
            </div>

            {/* EBS Storage Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Amazon EBS gp3 Storage Volume</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {ebsStorageGb} GB SSD
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="100"
                step="2"
                value={ebsStorageGb}
                onChange={(e) => setEbsStorageGb(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                <span>8 GB (Min)</span>
                <span>20 GB (Recommended)</span>
                <span>30 GB (Free Tier Max)</span>
                <span>100 GB</span>
              </div>
            </div>

            {/* Free Tier Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={hasFreeTier}
                  onChange={(e) => setHasFreeTier(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-emerald-400 block">
                    Apply AWS 12-Month Free Tier Benefit
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Includes 750 free hours/month of t2/t3.micro + 30GB EBS gp3 storage.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Calculation Bill Summary (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Estimated Monthly Spend
                </span>
                <div className="text-3xl font-extrabold text-white font-mono mt-0.5 tracking-tight flex items-baseline gap-2">
                  <span className={calculation.totalCost === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    {formatPrice(calculation.totalCost)}
                  </span>
                  <span className="text-xs font-normal text-slate-500 font-sans">
                    / month
                  </span>
                </div>
              </div>

              {calculation.totalCost === 0 && (
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  100% FREE TIER
                </span>
              )}
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  <span>Compute ({currentInstance.type}):</span>
                </span>
                <span className="font-semibold text-white">
                  {formatPrice(calculation.computeCost)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <span>EBS gp3 Storage ({ebsStorageGb} GB):</span>
                </span>
                <span className="font-semibold text-white">
                  {formatPrice(calculation.storageCost)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-slate-500" />
                  <span>Data Transfer Out:</span>
                </span>
                <span className="font-semibold text-emerald-400">
                  {calculation.transferCost === 0 ? '$0.00 (First 100GB Free)' : formatPrice(calculation.transferCost)}
                </span>
              </div>

              {calculation.elasticIpCost > 0 && (
                <div className="flex items-center justify-between text-amber-300">
                  <span>Static Elastic IP (idle time):</span>
                  <span>{formatPrice(calculation.elasticIpCost)}</span>
                </div>
              )}

              {/* Free Tier Savings Row */}
              {calculation.totalSavings > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Free Tier Savings:</span>
                  </span>
                  <span>-{formatPrice(calculation.totalSavings)}</span>
                </div>
              )}
            </div>
          </div>

          {/* FinOps Optimization Insight Card */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FinOps Architecture Recommendation</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {currentInstance.type.startsWith('t4g')
                ? 'Great choice! AWS Graviton2 (ARM) instances deliver up to 40% better price-performance compared to comparable x86 instances for Dockerized Node.js workloads.'
                : currentInstance.type === 't2.micro'
                ? 't2.micro qualifies for Free Tier, but upgrading to t3.micro or t4g.micro gives you 2 vCPUs instead of 1 with higher burst performance!'
                : `${currentInstance.type} is ideal for steady Docker container traffic. Consider setting an auto-shutdown cron script for staging environments to save up to 60%.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
