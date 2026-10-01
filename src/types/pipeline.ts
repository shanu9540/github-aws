export type PipelineTool = 'github-actions' | 'jenkins';

export type LanguageMode = 'hinglish' | 'english';

export interface PipelineStep {
  id: string;
  number: string;
  title: string;
  titleHi: string;
  summary: string;
  summaryHi: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  commands?: {
    label: string;
    description?: string;
    code: string;
    language: string;
  }[];
  files?: {
    path: string;
    description: string;
    code: string;
  }[];
  checklist: string[];
  keyTakeaway: string;
  keyTakeawayHi: string;
}

export interface PipelineSimulatorState {
  status: 'idle' | 'running' | 'success' | 'failed';
  currentStageIndex: number;
  commitHash: string;
  commitMessage: string;
  logs: SimulatorLog[];
  activeTab: 'stages' | 'terminal' | 'server-status';
}

export interface SimulatorLog {
  id: string;
  timestamp: string;
  stage: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
}

export interface ProjectConfig {
  appName: string;
  dockerHubUsername: string;
  appPort: number;
  hostPort: number;
  ec2User: string;
  branch: string;
  awsRegion: string;
  healthEndpoint: string;
  instanceType: string;
  enableEcr: boolean;
  enableTrivy: boolean;
  enableSsl: boolean;
  domainName: string;
}
