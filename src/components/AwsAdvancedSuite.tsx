import React, { useState } from 'react';
import {
  Cloud,
  ShieldCheck,
  Terminal,
  Server,
  Layers,
  Activity,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  Lock,
  ChevronRight,
  Zap,
  ArrowRight,
  Cpu,
  Calculator,
} from 'lucide-react';
import { ProjectConfig, LanguageMode } from '../types/pipeline';
import {
  ADVANCED_FEATURE_HIGHLIGHTS,
  AWS_COST_ESTIMATION,
  generateTerraformMain,
  generateTerraformVariables,
  generateTerraformOutputs,
  generateEcrOidcWorkflow,
  generateNginxConfig,
  generateMultiContainerCompose,
  generateCloudWatchConfig,
} from '../data/awsAdvancedFeatures';
import { AwsCostCalculator } from './AwsCostCalculator';
import { AwsResourceHealthMonitor } from './AwsResourceHealthMonitor';

interface AwsAdvancedSuiteProps {
  config: ProjectConfig;
  setConfig?: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  language: LanguageMode;
  initialSubTab?: string;
}

export const AwsAdvancedSuite: React.FC<AwsAdvancedSuiteProps> = ({
  config,
  setConfig,
  language,
  initialSubTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(
    initialSubTab || 'monitoring'
  );
  const [monitoringMode, setMonitoringMode] = useState<'dashboard' | 'config'>('dashboard');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <span>ENTERPRISE EXTENSIONS</span>
            <span>·</span>
            <span>AWS CLOUD &amp; DEVSECOPS SUITE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Advanced Cloud &amp; DevOps Integrations
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {language === 'hinglish'
              ? 'Basic EC2 deploy ke alawa ye 6 advanced features aapke project ko senior DevOps engineer level ka bana denge: Terraform IaC, Amazon ECR + OIDC, DevSecOps Trivy, Nginx SSL, CloudWatch alerts aur Free Tier cost control.'
              : 'Level up from basic container deployment to enterprise-grade cloud architecture with Terraform IaC, IAM OIDC passwordless CI/CD, DevSecOps vulnerability gates, and multi-container Nginx proxies.'}
          </p>
        </div>
      </div>

      {/* Feature Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {ADVANCED_FEATURE_HIGHLIGHTS.map((feat) => {
          const isActive = activeSubTab === feat.id;
          return (
            <button
              key={feat.id}
              onClick={() => setActiveSubTab(feat.id)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                isActive
                  ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium text-amber-400/90">
                  {feat.category}
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {feat.badge}
                </span>
              </div>
              <div className="text-xs font-semibold line-clamp-2 mt-1 leading-snug">
                {language === 'hinglish' ? feat.titleHi : feat.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature In-Depth Content */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6">
        {/* SUBTAB 1: TERRAFORM IAC */}
        {activeSubTab === 'iac' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                  Infrastructure as Code
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Automate Entire AWS Setup with HashiCorp Terraform
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {language === 'hinglish'
                    ? 'AWS Console me jaakar bar bar click karne ki zaroorat nahi. Ye Terraform script ek single command me VPC, Subnet, Security Group, EC2 server aur Elastic IP create kar deta hai.'
                    : 'Provision the entire cloud infrastructure declaratively in 45 seconds using HashiCorp Terraform, preventing configuration drift across staging and production.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    copyToClipboard(generateTerraformMain(config), 'tf-main')
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer"
                >
                  {copiedKey === 'tf-main' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'tf-main' ? 'Copied main.tf' : 'Copy main.tf'}</span>
                </button>
              </div>
            </div>

            {/* Quick CLI Execution Guide */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-amber-400 block text-[10px] mb-1">
                  1. Initialize Provider
                </span>
                <code className="text-slate-200">terraform init</code>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-amber-400 block text-[10px] mb-1">
                  2. Preview Changes
                </span>
                <code className="text-slate-200">terraform plan</code>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-amber-400 block text-[10px] mb-1">
                  3. Deploy Cloud Infra
                </span>
                <code className="text-slate-200">terraform apply -auto-approve</code>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-amber-400 block text-[10px] mb-1">
                  4. Tear Down (Cleanup)
                </span>
                <code className="text-slate-200">terraform destroy</code>
              </div>
            </div>

            {/* Code Box: main.tf */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>terraform/main.tf (VPC + Security Group + EC2 + EIP)</span>
                <span className="text-amber-400">HCL</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 max-h-96 overflow-y-auto leading-relaxed selection:bg-amber-500/20">
                <code>{generateTerraformMain(config)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SUBTAB 2: AMAZON ECR & IAM OIDC */}
        {activeSubTab === 'ecr-oidc' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                  Enterprise Security
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Passwordless Amazon ECR Deployment via AWS IAM OIDC
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {language === 'hinglish'
                    ? 'GitHub Secrets me AWS_ACCESS_KEY_ID ya AWS_SECRET_ACCESS_KEY store karne ki zaroorat nahi. OpenID Connect (OIDC) se GitHub Actions directly temporary 15-minute token leta hai.'
                    : 'Eliminate static, leakable credentials. Uses AWS Security Token Service (STS) to authenticate GitHub Actions runners with temporary, role-based tokens.'}
                </p>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(generateEcrOidcWorkflow(config), 'ecr-workflow')
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer"
              >
                {copiedKey === 'ecr-workflow' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy ECR Workflow</span>
              </button>
            </div>

            {/* Comparison Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/40 space-y-2">
                <span className="text-xs font-bold text-rose-400 uppercase">
                  Traditional Static Keys (Risky)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Storing long-lived AWS Access Keys in GitHub Secrets. If the secret leaks or a contributor inspects logs, your entire AWS account can be compromised.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase">
                  AWS IAM OIDC (Best Practice)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No static passwords or keys stored anywhere. AWS trusts token signatures issued by GitHub Actions for your specific repository name only.
                </p>
              </div>
            </div>

            {/* Workflow Code */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>.github/workflows/deploy-aws-ecr-oidc.yml</span>
                <span className="text-amber-400">YAML</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 max-h-80 overflow-y-auto leading-relaxed selection:bg-amber-500/20">
                <code>{generateEcrOidcWorkflow(config)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SUBTAB 3: TRIVY DEVSECOPS */}
        {activeSubTab === 'trivy' && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                DevSecOps Pipeline Security
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Aqua Trivy Container Vulnerability &amp; Secret Scanning
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {language === 'hinglish'
                  ? 'DevOps me security sabse zaroori hoti hai. Trivy tool automatically check karta hai ki aapke container OS (Alpine/Ubuntu) ya npm packages me koi High/Critical vulnerability toh nahi hai.'
                  : 'Scan containers and Dockerfiles before push. Enforces automated security gates in CI to prevent deploying vulnerable packages or leaked secrets.'}
              </p>
            </div>

            {/* CLI Snippet */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Run Local Security Scan with Trivy
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'trivy image --severity HIGH,CRITICAL node-docker-app:latest',
                      'trivy-cli'
                    )
                  }
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-mono cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-2.5 bg-slate-900 rounded font-mono text-xs text-amber-300">
                <code>trivy image --severity HIGH,CRITICAL {config.appName}:latest</code>
              </pre>
            </div>

            {/* GitHub Actions Step Snippet */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">
                GitHub Actions Automated Gate Step
              </span>
              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
{`- name: Run Trivy Vulnerability Scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: '${config.dockerHubUsername}/${config.appName}:latest'
    format: 'table'
    exit-code: '1' # Fails the pipeline if CRITICAL vulnerability found
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL,HIGH'`}
              </pre>
            </div>
          </div>
        )}

        {/* SUBTAB 4: NGINX REVERSE PROXY & SSL */}
        {activeSubTab === 'nginx-ssl' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                  Production Edge Architecture
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Multi-Container Nginx Reverse Proxy with Rate Limiting
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {language === 'hinglish'
                    ? 'Production me Node.js container ko direct internet pe expose karne ke bajaye Nginx reverse proxy aage rakhte hain. Isse DDoS protection, Gzip aur SSL certificate milta hai.'
                    : 'Shield Node.js processes behind an Nginx reverse proxy for SSL termination, IP rate limiting, response caching, and hardened security headers.'}
                </p>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(generateNginxConfig(config), 'nginx-conf')
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer"
              >
                {copiedKey === 'nginx-conf' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy nginx.conf</span>
              </button>
            </div>

            {/* Multi-container Docker Compose */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>docker-compose.prod.yml (Nginx + Node App internal bridge)</span>
                <span className="text-amber-400">YAML</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 max-h-72 overflow-y-auto leading-relaxed">
                <code>{generateMultiContainerCompose(config)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SUBTAB 5: CLOUDWATCH MONITORING & CHATOPS */}
        {activeSubTab === 'monitoring' && (
          <div className="space-y-5">
            {/* View Mode Segmented Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                  CloudWatch Observability &amp; Metrics
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  AWS Resource Health Monitor &amp; Alarms Console
                </h3>
              </div>

              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setMonitoringMode('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    monitoringMode === 'dashboard'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Health Monitor</span>
                </button>
                <button
                  onClick={() => setMonitoringMode('config')}
                  className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    monitoringMode === 'config'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Agent &amp; Slack Config</span>
                </button>
              </div>
            </div>

            {monitoringMode === 'dashboard' ? (
              <AwsResourceHealthMonitor config={config} language={language} />
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'hinglish'
                    ? 'CloudWatch Agent ko EC2 pe configure karne ke liye niche di gayi amazon-cloudwatch-agent.json file use karein, aur deployment complete hone par Slack me automated notification bhejne ke liye step use karein.'
                    : 'Configure the CloudWatch unified agent on EC2 with the configuration below to publish memory and disk utilization, and use the ChatOps step to notify teams on GitHub Actions events.'}
                </p>

                {/* Slack Step Snippet */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Slack/Discord Notification Step in GitHub Actions
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `- name: Notify Team on Deployment Outcome\n  if: always()\n  uses: rtCamp/action-slack-notify@v2\n  env:\n    SLACK_WEBHOOK: \${{ secrets.SLACK_WEBHOOK_URL }}\n    SLACK_CHANNEL: devops-alerts\n    SLACK_COLOR: \${{ job.status == 'success' && 'good' || 'danger' }}\n    SLACK_MESSAGE: 'EC2 Deployment \${{ job.status }} for \${{ env.DOCKER_IMAGE }}'\n    SLACK_TITLE: 'AWS EC2 Production Rollout'`,
                          'slack-step'
                        )
                      }
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'slack-step' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedKey === 'slack-step' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
{`- name: Notify Team on Deployment Outcome
  if: always()
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: \${{ secrets.SLACK_WEBHOOK_URL }}
    SLACK_CHANNEL: devops-alerts
    SLACK_COLOR: \${{ job.status == 'success' && 'good' || 'danger' }}
    SLACK_MESSAGE: 'EC2 Deployment \${{ job.status }} for \${{ env.DOCKER_IMAGE }}'
    SLACK_TITLE: 'AWS EC2 Production Rollout'`}
                  </pre>
                </div>

                {/* CloudWatch Agent Config */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                    <span>amazon-cloudwatch-agent.json (EC2 Memory &amp; Disk Telemetry)</span>
                    <button
                      onClick={() =>
                        copyToClipboard(generateCloudWatchConfig(), 'cw-config')
                      }
                      className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'cw-config' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedKey === 'cw-config' ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto leading-relaxed">
                    <code>{generateCloudWatchConfig()}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 6: BLUE/GREEN DEPLOYMENT & COST */}
        {activeSubTab === 'blue-green' && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                Cost Optimization &amp; Release Strategy
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                AWS Free Tier Budgeting &amp; Zero-Downtime Blue/Green Strategy
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {language === 'hinglish'
                  ? 'AWS pe project chalane me koi paisa na kate, isliye AWS Free Tier limits aur $5 Budget Alert setup karna bahut zaroori hota hai.'
                  : 'Stay 100% within the AWS Free Tier with budget alarms, and eliminate release downtime using dual container ports.'}
              </p>
            </div>

            {/* AWS Cost Breakdown Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">AWS Service</th>
                    <th className="p-3">Free Tier Status</th>
                    <th className="p-3">Free Monthly Quota</th>
                    <th className="p-3">Optimization Advice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {AWS_COST_ESTIMATION.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-900/60">
                      <td className="p-3 font-semibold text-slate-200">
                        {item.service}
                      </td>
                      <td className="p-3 font-mono text-emerald-400">
                        {item.tier}
                      </td>
                      <td className="p-3 text-slate-300">{item.freeQuota}</td>
                      <td className="p-3 text-slate-400">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Budget Alert Rule */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <span className="font-bold text-amber-300">
                  {language === 'hinglish'
                    ? 'AWS Zero-Cost Safety Rule: '
                    : 'AWS Zero-Surprise Billing Rule: '}
                </span>
                {language === 'hinglish'
                  ? 'AWS Management Console me jakar "AWS Budgets" kholo aur $5 ka threshold alert email set karo. Agar Free Tier limit cross hone lagegi toh AWS aapko turant alert email bhej dega.'
                  : 'Navigate to AWS Budgets and create a $5 monthly threshold alert. AWS will immediately notify your email if any usage exceeds Free Tier boundaries.'}
              </div>
            </div>

            {/* Launch Calculator Quick Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSubTab('cost-calculator')}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Launch Interactive EC2 Monthly Cost Calculator &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 7: EC2 MONTHLY COST CALCULATOR */}
        {activeSubTab === 'cost-calculator' && (
          <AwsCostCalculator
            config={config}
            setConfig={setConfig}
            language={language}
          />
        )}
      </div>
    </div>
  );
};
