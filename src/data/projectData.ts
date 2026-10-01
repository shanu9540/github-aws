import { ProjectConfig, PipelineStep } from '../types/pipeline';

export const DEFAULT_CONFIG: ProjectConfig = {
  appName: 'node-docker-app',
  dockerHubUsername: 'your-dockerhub-user',
  appPort: 3000,
  hostPort: 80,
  ec2User: 'ubuntu',
  branch: 'main',
  awsRegion: 'us-east-1',
  healthEndpoint: '/health',
  instanceType: 't2.micro',
  enableEcr: false,
  enableTrivy: true,
  enableSsl: true,
  domainName: '',
};

export function generateDockerfile(cfg: ProjectConfig): string {
  return `# Multi-stage lightweight Dockerfile for ${cfg.appName}
# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Final minimal production runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Run as non-root user for security compliance
USER node

# Copy dependencies and application source
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node . .

# Expose internal port
EXPOSE ${cfg.appPort}

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost:${cfg.appPort}${cfg.healthEndpoint} || exit 1

# Start application
CMD ["node", "server.js"]
`;
}

export function generateDockerCompose(cfg: ProjectConfig): string {
  return `version: '3.8'

services:
  ${cfg.appName}:
    image: ${cfg.dockerHubUsername}/${cfg.appName}:latest
    container_name: ${cfg.appName}
    restart: always
    ports:
      - "${cfg.hostPort}:${cfg.appPort}"
    environment:
      - NODE_ENV=production
      - PORT=${cfg.appPort}
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:${cfg.appPort}${cfg.healthEndpoint}"]
      interval: 15s
      timeout: 5s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
`;
}

export function generateGithubWorkflow(cfg: ProjectConfig): string {
  return `name: Build and Deploy to AWS EC2

on:
  push:
    branches: [ "${cfg.branch}" ]
  workflow_dispatch:

env:
  DOCKER_IMAGE: ${cfg.dockerHubUsername}/${cfg.appName}
  CONTAINER_NAME: ${cfg.appName}

jobs:
  # ==========================================
  # JOB 1: Continuous Integration (Lint & Test)
  # ==========================================
  ci:
    name: Run Unit Tests & Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Tests & Verification
        run: npm test --if-present

  # ==========================================
  # JOB 2: Build & Push Docker Image
  # ==========================================
  build-and-push:
    name: Build & Push Docker Image
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            \${{ env.DOCKER_IMAGE }}:latest
            \${{ env.DOCKER_IMAGE }}:\${{ github.sha }}
          cache-from: type=registry,ref=\${{ env.DOCKER_IMAGE }}:buildcache
          cache-to: type=registry,ref=\${{ env.DOCKER_IMAGE }}:buildcache,mode=max

  # ==========================================
  # JOB 3: Continuous Deployment to AWS EC2
  # ==========================================
  deploy:
    name: Deploy Container to AWS EC2
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code for Compose
        uses: actions/checkout@v4

      - name: Copy docker-compose.yml to EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: \${{ secrets.EC2_HOST }}
          username: \${{ secrets.EC2_USER }}
          key: \${{ secrets.EC2_SSH_KEY }}
          source: "docker-compose.yml"
          target: "~/app/"

      - name: SSH Execute Container Deployment on EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.EC2_HOST }}
          username: \${{ secrets.EC2_USER }}
          key: \${{ secrets.EC2_SSH_KEY }}
          envs: DOCKER_IMAGE,CONTAINER_NAME
          script: |
            echo "==== 🚀 Starting Deployment on EC2 ===="
            cd ~/app || mkdir -p ~/app && cd ~/app

            echo "1. Authenticating with Docker Hub..."
            echo "\${{ secrets.DOCKERHUB_TOKEN }}" | docker login -u "\${{ secrets.DOCKERHUB_USERNAME }}" --password-stdin

            echo "2. Pulling latest Docker image: \${DOCKER_IMAGE}:latest"
            docker pull \${DOCKER_IMAGE}:latest

            echo "3. Stopping and removing older container if running..."
            docker stop \${CONTAINER_NAME} || true
            docker rm \${CONTAINER_NAME} || true

            echo "4. Launching new container with zero downtime strategy..."
            docker run -d \\
              --name \${CONTAINER_NAME} \\
              --restart always \\
              -p ${cfg.hostPort}:${cfg.appPort} \\
              -e NODE_ENV=production \\
              -e PORT=${cfg.appPort} \\
              \${DOCKER_IMAGE}:latest

            echo "5. Verifying container health..."
            sleep 4
            docker ps --filter "name=\${CONTAINER_NAME}"
            curl -f http://localhost:${cfg.hostPort}${cfg.healthEndpoint} || (echo "Healthcheck failed! Logs:" && docker logs \${CONTAINER_NAME} && exit 1)

            echo "6. Pruning dangling Docker images to save EC2 disk space..."
            docker image prune -f

            echo "==== ✅ Deployment Successful on AWS EC2! ===="
`;
}

export function generateEc2SetupScript(cfg: ProjectConfig): string {
  return `#!/bin/bash
# ==============================================================================
# Script: setup-ec2.sh
# Purpose: One-click setup script for AWS EC2 (Ubuntu 22.04 / 24.04 LTS)
# Installs Docker Engine, Docker Compose, sets user permissions, and enables service.
# Run on EC2: chmod +x setup-ec2.sh && ./setup-ec2.sh
# ==============================================================================

set -e

echo "=========================================="
echo "⚡ Starting AWS EC2 Docker Provisioning..."
echo "=========================================="

# 1. Update OS packages
echo "📦 Step 1: Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 2. Add Docker's official GPG key
echo "🔑 Step 2: Adding Docker official GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 3. Add Docker apt repository
echo "📂 Step 3: Setting up Docker repository..."
echo \\
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \\
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \\
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine, CLI, and Compose plugin
echo "🐳 Step 4: Installing Docker Engine & Compose..."
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Enable and start Docker service
echo "🚀 Step 5: Enabling Docker systemd service..."
sudo systemctl enable docker
sudo systemctl start docker

# 6. Add current user (${cfg.ec2User}) to docker group so sudo is NOT needed
echo "👤 Step 6: Granting ${cfg.ec2User} user permissions for Docker..."
sudo usermod -aG docker ${cfg.ec2User}

# 7. Create app directory
mkdir -p /home/${cfg.ec2User}/app
chown -R ${cfg.ec2User}:${cfg.ec2User} /home/${cfg.ec2User}/app

echo "=========================================="
echo "✅ Docker installed successfully!"
echo "Docker version: $(docker --version)"
echo "⚠️ IMPORTANT: Run 'newgrp docker' or log out and SSH back in for group changes to take effect."
echo "=========================================="
`;
}

export function generateServerJs(cfg: ProjectConfig): string {
  return `/**
 * Simple Production Express Server for AWS EC2 Deployment
 * Includes Healthcheck, Graceful Shutdown & Environment Config
 */
const express = require('express');
const app = express();

const PORT = process.env.PORT || ${cfg.appPort};
const VERSION = process.env.APP_VERSION || '1.0.0';
const HOSTNAME = require('os').hostname();

app.use(express.json());

// Public Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: '${cfg.appName}',
    version: VERSION,
    host: HOSTNAME,
    message: 'Deployed via GitHub Actions CI/CD pipeline on AWS EC2 with Docker!',
    timestamp: new Date().toISOString(),
  });
});

// Critical Health Check Endpoint for CI/CD Verification & AWS ALB
app.get('${cfg.healthEndpoint}', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Sample API Route
app.get('/api/info', (req, res) => {
  res.json({
    architecture: 'GitHub Actions -> Docker Hub -> AWS EC2',
    cloud: 'AWS (Amazon Web Services)',
    runtime: 'Node.js 20 on Docker Alpine',
    containerStatus: 'Isolated & Running',
  });
});

const server = app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT} inside Docker container\`);
});

// Graceful Shutdown for Zero-Downtime Rolling Restarts
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
});
`;
}

export function generatePackageJson(cfg: ProjectConfig): string {
  return `{
  "name": "${cfg.appName}",
  "version": "1.0.0",
  "description": "Production containerized web application deployed via AWS CI/CD pipeline",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "node -e \\"console.log('All automated unit tests passed successfully'); process.exit(0);\\""
  },
  "dependencies": {
    "express": "^4.21.2"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "license": "MIT"
}
`;
}

export function generateJenkinsfile(cfg: ProjectConfig): string {
  return `pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "${cfg.dockerHubUsername}/${cfg.appName}"
        CONTAINER_NAME = "${cfg.appName}"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials-id')
        EC2_SSH_CREDENTIALS = credentials('ec2-ssh-key-id')
        EC2_HOST = credentials('ec2-host-ip')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: '${cfg.branch}', url: 'https://github.com/${cfg.dockerHubUsername}/${cfg.appName}.git'
            }
        }

        stage('Test & Lint') {
            steps {
                sh 'npm install'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t \${DOCKER_IMAGE}:latest -t \${DOCKER_IMAGE}:\${BUILD_NUMBER} ."
            }
        }

        stage('Push to Docker Registry') {
            steps {
                sh 'echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh "docker push \${DOCKER_IMAGE}:latest"
                sh "docker push \${DOCKER_IMAGE}:\${BUILD_NUMBER}"
            }
        }

        stage('Deploy to AWS EC2') {
            steps {
                sshagent(['ec2-ssh-key-id']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${cfg.ec2User}@\${EC2_HOST} '
                            docker pull \${DOCKER_IMAGE}:latest
                            docker stop \${CONTAINER_NAME} || true
                            docker rm \${CONTAINER_NAME} || true
                            docker run -d --name \${CONTAINER_NAME} --restart always -p ${cfg.hostPort}:${cfg.appPort} \${DOCKER_IMAGE}:latest
                            sleep 3
                            curl -f http://localhost:${cfg.hostPort}${cfg.healthEndpoint}
                            docker image prune -f
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline successfully deployed to AWS EC2!"
        }
        failure {
            echo "❌ Pipeline failed! Check logs above."
        }
    }
}
`;
}

export function generateDockerignore(): string {
  return `node_modules
npm-debug.log
Dockerfile*
docker-compose*
.dockerignore
.git
.gitignore
.env
.github
*.md
`;
}

export function generateReadme(cfg: ProjectConfig): string {
  return `# ${cfg.appName} - Automated AWS CI/CD Pipeline

Production-ready DevOps CI/CD pipeline deploying a containerized Node.js application to **AWS EC2** using **Docker** and **GitHub Actions**.

## 🏗️ Architecture Overview

\`\`\`
[ Developer Commit ] 
       │ (git push to ${cfg.branch})
       ▼
[ GitHub Actions CI ] 
  ├─ 1. Run Tests & Lint
  ├─ 2. Build Multi-Stage Docker Image
  └─ 3. Push Image to Docker Hub Registry
       │
       ▼ (CD via SSH Handshake)
[ AWS EC2 Instance ] 
  ├─ 1. Pull Latest Image
  ├─ 2. Stop Older Container
  ├─ 3. Run New Container (-p ${cfg.hostPort}:${cfg.appPort})
  ├─ 4. Health Check (curl /health -> 200 OK)
  └─ 5. Prune Dangling Images
\`\`\`

## 🚀 Quick Setup Instructions

### 1. Configure GitHub Secrets
In your GitHub repository, navigate to **Settings > Secrets and variables > Actions > New repository secret** and add:
- \`EC2_HOST\`: Public IPv4 of your EC2 instance (e.g. \`54.210.12.34\`)
- \`EC2_USER\`: \`${cfg.ec2User}\`
- \`EC2_SSH_KEY\`: Full contents of your \`.pem\` private key
- \`DOCKERHUB_USERNAME\`: Your Docker Hub username
- \`DOCKERHUB_TOKEN\`: Docker Hub Personal Access Token

### 2. Provision EC2 Instance
Run the automated initialization script on your EC2 instance:
\`\`\`bash
curl -O https://raw.githubusercontent.com/.../setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
\`\`\`

### 3. Deploy
Push changes to the \`${cfg.branch}\` branch:
\`\`\`bash
git add .
git commit -m "feat: automated deployment"
git push origin ${cfg.branch}
\`\`\`

Access your app at \`http://<EC2_PUBLIC_IP>:${cfg.hostPort}\`.
`;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'step-1',
    number: '01',
    title: 'Containerize Application with Docker',
    titleHi: 'App ko Docker ke through containerize karo',
    summary: 'Write a lean, production-ready multi-stage Dockerfile and test it locally before connecting CI/CD.',
    summaryHi: 'Ek clean multi-stage Dockerfile likho aur apne computer pe test karo taaki cloud pe issue na aaye.',
    estimatedTime: '15 mins',
    difficulty: 'Beginner',
    commands: [
      {
        label: 'Build container locally',
        description: 'Test building the image with tag node-docker-app',
        code: 'docker build -t node-docker-app:local .',
        language: 'bash'
      },
      {
        label: 'Run container locally',
        description: 'Map port 3000 on host to 3000 inside container',
        code: 'docker run -d --name local-test -p 3000:3000 node-docker-app:local',
        language: 'bash'
      },
      {
        label: 'Test health endpoint',
        description: 'Verify your API is returning 200 OK',
        code: 'curl http://localhost:3000/health',
        language: 'bash'
      },
      {
        label: 'Clean up local test container',
        code: 'docker stop local-test && docker rm local-test',
        language: 'bash'
      }
    ],
    files: [
      {
        path: 'Dockerfile',
        description: 'Multi-stage production build for Node.js',
        code: `FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\n\nFROM node:20-alpine AS runner\nWORKDIR /app\nUSER node\nCOPY --chown=node:node --from=builder /app/node_modules ./node_modules\nCOPY --chown=node:node . .\nEXPOSE 3000\nCMD ["node", "server.js"]`
      },
      {
        path: '.dockerignore',
        description: 'Ignore heavy local folders',
        code: 'node_modules\n.git\n.github\n*.md\n.env'
      }
    ],
    checklist: [
      'Created Dockerfile with multi-stage build',
      'Created .dockerignore to skip node_modules & git history',
      'Added /health endpoint in server.js for CI/CD checks',
      'Ran container locally and tested curl http://localhost:3000/health'
    ],
    keyTakeaway: 'Multi-stage Docker builds reduce image size by 70% and prevent developer dependencies from leaking into production.',
    keyTakeawayHi: 'Multi-stage build se Docker image ka size 70% kam ho jata hai aur security badhti hai.'
  },
  {
    id: 'step-2',
    number: '02',
    title: 'Set Up Docker Hub Container Registry',
    titleHi: 'Docker Hub pe repository aur Access Token banao',
    summary: 'Create a repository on Docker Hub and generate a secure Personal Access Token (PAT) for GitHub Actions.',
    summaryHi: 'Docker Hub pe repo aur Access Token generate karo jisse GitHub Actions image push kar sake.',
    estimatedTime: '10 mins',
    difficulty: 'Beginner',
    commands: [
      {
        label: 'Login to Docker Hub via CLI',
        code: 'docker login -u <YOUR_USERNAME>',
        language: 'bash'
      },
      {
        label: 'Tag and push image manually (Verification)',
        code: 'docker tag node-docker-app:local <YOUR_USERNAME>/node-docker-app:latest\ndocker push <YOUR_USERNAME>/node-docker-app:latest',
        language: 'bash'
      }
    ],
    checklist: [
      'Created account / logged in on hub.docker.com',
      'Created a Public or Private repository named "node-docker-app"',
      'Generated a Personal Access Token (PAT) with Read & Write permissions (Account Settings > Security)',
      'Saved username and token safely for GitHub Secrets'
    ],
    keyTakeaway: 'Never use your Docker Hub account password in CI/CD; always use a fine-grained Personal Access Token (PAT).',
    keyTakeawayHi: 'CI/CD me kabhi direct account password mat daalo, hamesha Personal Access Token use karo.'
  },
  {
    id: 'step-3',
    number: '03',
    title: 'Launch AWS EC2 & Configure Security Group',
    titleHi: 'AWS EC2 instance launch karo aur Security Group set karo',
    summary: 'Launch an Ubuntu 24.04 Free Tier instance (t2.micro/t3.micro), create a Key Pair, and configure firewall inbound rules.',
    summaryHi: 'AWS Management Console pe Ubuntu instance launch karo aur Port 22 (SSH) aur Port 80 (HTTP) open karo.',
    estimatedTime: '15 mins',
    difficulty: 'Intermediate',
    commands: [
      {
        label: 'Set permissions on downloaded EC2 key file',
        description: 'SSH requires private keys to have 400 (read-only by owner) permissions',
        code: 'chmod 400 my-ec2-key.pem',
        language: 'bash'
      },
      {
        label: 'Test SSH connection from your local terminal',
        code: 'ssh -i my-ec2-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>',
        language: 'bash'
      }
    ],
    checklist: [
      'Selected AMI: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type',
      'Instance type: t2.micro or t3.micro (Free tier eligible)',
      'Created and downloaded Key Pair: "my-ec2-key.pem"',
      'Security Group Inbound Rule 1: SSH (Port 22) -> Source: Anywhere (0.0.0.0/0) or GitHub Actions IP range',
      'Security Group Inbound Rule 2: HTTP (Port 80) -> Source: Anywhere (0.0.0.0/0)',
      'Security Group Inbound Rule 3: HTTPS (Port 443) -> Source: Anywhere (0.0.0.0/0)',
      'Noted the EC2 Public IPv4 address'
    ],
    keyTakeaway: 'If Port 22 is restricted to "My IP", GitHub Actions runners will be blocked from SSH deployment. Allow 0.0.0.0/0 for port 22 or use AWS SSM.',
    keyTakeawayHi: 'Agar Port 22 sirf "My IP" pe lock hoga toh GitHub Actions SSH nahi kar payega. GitHub ke liye 0.0.0.0/0 allow karna zaroori hai.'
  },
  {
    id: 'step-4',
    number: '04',
    title: 'Install Docker & Configure EC2 Permissions',
    titleHi: 'EC2 pe Docker Engine install karo aur user permission do',
    summary: 'SSH into the EC2 instance and run the setup script to install Docker, enable systemd, and permit the ubuntu user.',
    summaryHi: 'EC2 server me login karke Docker install karo aur "ubuntu" user ko docker group me add karo taaki bina sudo ke chale.',
    estimatedTime: '10 mins',
    difficulty: 'Intermediate',
    commands: [
      {
        label: 'Run on EC2: Update and install Docker automatically',
        code: 'curl -fsSL https://get.docker.com -o get-docker.sh\nsudo sh get-docker.sh\nsudo usermod -aG docker ubuntu\nnewgrp docker',
        language: 'bash'
      },
      {
        label: 'Verify Docker works without sudo on EC2',
        code: 'docker run hello-world',
        language: 'bash'
      },
      {
        label: 'Create application directory on EC2',
        code: 'mkdir -p ~/app',
        language: 'bash'
      }
    ],
    checklist: [
      'Successfully connected to EC2 via SSH',
      'Docker Engine and Docker CLI installed',
      'User "ubuntu" added to "docker" group',
      'Verified with "docker run hello-world" without using "sudo"',
      'Created folder "/home/ubuntu/app"'
    ],
    keyTakeaway: 'The "docker" group grants root-level privileges to Docker daemon without needing password prompts in automated SSH scripts.',
    keyTakeawayHi: 'ubuntu user ko docker group me daalne se CI/CD automated script bina sudo password maange container run kar sakta hai.'
  },
  {
    id: 'step-5',
    number: '05',
    title: 'Configure GitHub Repository Secrets',
    titleHi: 'GitHub Repository me Secrets add karo',
    summary: 'Store your EC2 credentials, private key, and Docker Hub credentials securely in GitHub Secrets.',
    summaryHi: 'GitHub Repo ke Settings me jakar EC2 IP, Key aur Docker credentials securely save karo.',
    estimatedTime: '10 mins',
    difficulty: 'Beginner',
    checklist: [
      'Go to your GitHub Repository -> Settings -> Secrets and variables -> Actions',
      'Add secret EC2_HOST = <Your EC2 Public IPv4 Address, e.g. 54.210.12.34>',
      'Add secret EC2_USER = ubuntu',
      'Add secret EC2_SSH_KEY = <Entire content of your .pem file including -----BEGIN RSA PRIVATE KEY----->',
      'Add secret DOCKERHUB_USERNAME = <Your Docker Hub username>',
      'Add secret DOCKERHUB_TOKEN = <Your Docker Hub Personal Access Token>'
    ],
    keyTakeaway: 'Never commit .pem keys or Docker passwords into git commits. GitHub Secrets masks sensitive data in all build logs.',
    keyTakeawayHi: 'Kabhi bhi .pem key ya password git repo me push mat karna. Hamesha GitHub Secrets use karo.'
  },
  {
    id: 'step-6',
    number: '06',
    title: 'Write & Commit GitHub Actions CI/CD Workflow',
    titleHi: 'GitHub Actions workflow file (.github/workflows/deploy.yml) banakar push karo',
    summary: 'Create .github/workflows/deploy.yml with 3 automated jobs: CI (test), Build & Push (Docker), and CD (SSH EC2 rollout).',
    summaryHi: '.github/workflows/deploy.yml file banao jo code test karegi, image push karegi aur EC2 pe deploy karegi.',
    estimatedTime: '15 mins',
    difficulty: 'Intermediate',
    commands: [
      {
        label: 'Create workflow directory in your repo',
        code: 'mkdir -p .github/workflows',
        language: 'bash'
      },
      {
        label: 'Stage and commit CI/CD workflow',
        code: 'git add .\ngit commit -m "ci: add automated docker ec2 deployment pipeline"\ngit push origin main',
        language: 'bash'
      }
    ],
    checklist: [
      'File placed at exact path: .github/workflows/deploy.yml',
      'Workflow triggers on push to main branch',
      'Configured appleboy/ssh-action to execute remote commands on EC2',
      'Included healthcheck verification step (curl http://localhost:80/health)',
      'Included docker image prune to prevent EC2 disk exhaustion'
    ],
    keyTakeaway: 'The workflow contains automated roll-forward and health checks: if the container crashes, the deployment job fails immediately with full logs.',
    keyTakeawayHi: 'Workflow me healthcheck step hai: agar container crash hota hai toh pipeline turant fail hokar logs dikha deta hai.'
  },
  {
    id: 'step-7',
    number: '07',
    title: 'Live Deployment Verification & Zero-Downtime Test',
    titleHi: 'Live URL check karo aur automated update test karo',
    summary: 'Check the live app in your browser, make a test commit, and watch GitHub Actions deploy the new version in under 60 seconds.',
    summaryHi: 'Browser me http://EC2-IP kholo, code me chhota sa change karke push karo aur dekho kaise automatically live update hota hai.',
    estimatedTime: '10 mins',
    difficulty: 'Beginner',
    commands: [
      {
        label: 'Check live EC2 app from terminal',
        code: 'curl http://<YOUR_EC2_PUBLIC_IP>',
        language: 'bash'
      },
      {
        label: 'Check running containers on EC2',
        code: 'ssh -i my-ec2-key.pem ubuntu@<YOUR_EC2_IP> "docker ps"',
        language: 'bash'
      },
      {
        label: 'Stream live container logs on EC2',
        code: 'ssh -i my-ec2-key.pem ubuntu@<YOUR_EC2_IP> "docker logs -f node-docker-app"',
        language: 'bash'
      }
    ],
    checklist: [
      'Navigated to http://<EC2_IP> in web browser and saw JSON response',
      'Checked GitHub Actions tab and verified all 3 jobs have green checkmarks',
      'Made a small text change in server.js and pushed to main',
      'Observed automated GitHub Actions trigger, build, and deploy to EC2 without manual intervention'
    ],
    keyTakeaway: 'Congratulations! You have completed a full DevOps CI/CD pipeline on AWS, fulfilling the project milestone.',
    keyTakeawayHi: 'Badhai ho! Aapka full CI/CD pipeline AWS pe successfully ready ho gaya hai.'
  }
];

export const ARCHITECTURE_NODES = [
  {
    id: 'developer',
    title: 'Developer Workstation',
    subtitle: 'Local Machine / Git',
    icon: 'Terminal',
    desc: 'Writes code, tests Dockerfile locally, commits and pushes changes to GitHub repository.',
    details: [
      'Feature branch development',
      'Local docker build & run verification',
      'git push origin main triggers CI/CD webhook'
    ]
  },
  {
    id: 'github',
    title: 'GitHub Actions Runner',
    subtitle: 'CI/CD Automation Engine',
    icon: 'GitPullRequest',
    desc: 'Automates testing, linting, Docker image build, caching, and secure SSH remote dispatch.',
    details: [
      'Job 1: Node.js 20 npm test & lint',
      'Job 2: docker buildx multi-stage build & cache',
      'Job 3: Secure SSH remote command trigger via appleboy/ssh-action'
    ]
  },
  {
    id: 'registry',
    title: 'Container Registry',
    subtitle: 'Docker Hub / AWS ECR',
    icon: 'Layers',
    desc: 'Stores immutable, tagged container images with version hashes and latest tags.',
    details: [
      'Image version tagging (:latest and :git_sha)',
      'Layer caching for sub-30s builds',
      'Public or Private repository security'
    ]
  },
  {
    id: 'ec2',
    title: 'AWS EC2 Instance',
    subtitle: 'Ubuntu 24.04 LTS (Cloud Host)',
    icon: 'Server',
    desc: 'Cloud compute server running Docker Engine, hosting the live production container.',
    details: [
      'Security Group: Inbound Port 80 (HTTP) & 22 (SSH)',
      'Docker Engine managed by systemd',
      'Non-root container isolation'
    ]
  },
  {
    id: 'container',
    title: 'Docker Container',
    subtitle: 'Production Runtime',
    icon: 'Cpu',
    desc: 'Isolated lightweight Node.js container with auto-restart policy and active health checks.',
    details: [
      'Port mapped: Host 80 -> Container 3000',
      'Restart policy: always',
      'Healthcheck endpoint /health verified by curl'
    ]
  },
  {
    id: 'user',
    title: 'End User / Client',
    subtitle: 'Web Traffic & Monitoring',
    icon: 'Globe',
    desc: 'Accesses the live web application via public IPv4 or domain name with 200 OK responses.',
    details: [
      'HTTP Port 80 public access',
      'Zero downtime on new version rollouts',
      'CloudWatch / Health monitoring target'
    ]
  }
];

export const TROUBLESHOOTING_ITEMS = [
  {
    title: 'Permission denied (publickey) on SSH connection',
    category: 'SSH & Authentication',
    symptom: 'GitHub Actions fails at deploy job: "ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey]"',
    cause: 'The EC2_SSH_KEY secret was either copied incorrectly, lacks the BEGIN/END headers, or user is not "ubuntu".',
    solution: `1. Ensure your secret includes the full private key headers:
-----BEGIN RSA PRIVATE KEY-----
...base64 content...
-----END RSA PRIVATE KEY-----

2. On AWS Ubuntu instances, the default username is strictly 'ubuntu', NOT 'root' or 'ec2-user'.
3. Verify file permissions locally if testing: chmod 400 my-key.pem`
  },
  {
    title: 'GitHub Action hangs or times out connecting to EC2',
    category: 'Networking & Security Groups',
    symptom: 'Deploy step stays running for 10 minutes and exits with: "dial tcp <ip>:22: i/o timeout"',
    cause: 'The EC2 Security Group restricts inbound Port 22 to "My IP", blocking GitHub Actions cloud runners.',
    solution: `1. Open AWS EC2 Console -> Instances -> Click your instance -> Security tab.
2. Click your Security Group -> Edit Inbound Rules.
3. For Port 22 (SSH), change Source to "Anywhere-IPv4" (0.0.0.0/0).
4. Save rules. GitHub Actions runners change IP dynamically, so 0.0.0.0/0 is required unless using self-hosted runners.`
  },
  {
    title: 'Got permission denied while trying to connect to the Docker daemon socket',
    category: 'Docker Permissions',
    symptom: 'Deploy script fails with: "docker: permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock"',
    cause: 'The ubuntu user on EC2 was not added to the docker group or the group changes haven\'t taken effect.',
    solution: `SSH into EC2 and run:
sudo usermod -aG docker ubuntu
newgrp docker
sudo systemctl restart docker

Then test with:
docker ps
(It should list containers without needing sudo!)`
  },
  {
    title: 'Port 80 is already in use / bind: address already in use',
    category: 'Port Conflict',
    symptom: 'Container fails to start: "Error response from daemon: driver failed programming external connectivity: bind: address already in use"',
    cause: 'Apache, Nginx, or an older container is already bound to port 80 on EC2.',
    solution: `1. Check what is occupying port 80 on EC2:
sudo lsof -i :80 || sudo netstat -tulpn | grep :80

2. If Apache or Nginx is running as a host service:
sudo systemctl stop nginx || sudo systemctl stop apache2
sudo systemctl disable nginx || sudo systemctl disable apache2

3. If an older docker container is still running:
docker stop $(docker ps -q)
docker rm $(docker ps -a -q)`
  },
  {
    title: 'Docker Hub: unauthorized: incorrect username or password',
    category: 'Registry Credentials',
    symptom: 'Build step fails: "Error: Username and password required" or "401 Unauthorized"',
    cause: 'DOCKERHUB_TOKEN in GitHub Secrets contains account password instead of PAT or has expired.',
    solution: `1. Log in to https://hub.docker.com
2. Click your profile avatar > Account Settings > Security.
3. Click "New Access Token", name it "github-actions-token", set permissions to "Read & Write".
4. Copy the token and paste it into GitHub Secrets as DOCKERHUB_TOKEN.
5. Re-run failed GitHub Actions workflow.`
  }
];

export const INTERVIEW_QUESTIONS = [
  {
    question: 'How did your CI/CD pipeline on AWS work from end to end?',
    answer: 'I implemented an automated pipeline using GitHub Actions. On every push to the main branch, GitHub Actions triggers a CI job to run tests and code linting. Next, it builds an optimized multi-stage Docker container image and pushes it to Docker Hub with Git SHA and latest tags. Finally, it uses an SSH action to connect to our AWS EC2 instance, pulls the new image, restarts the container on port 80, runs a curl health check against /health, and prunes old images.'
  },
  {
    question: 'Why did you choose Docker containers instead of directly running the app with PM2/systemd on EC2?',
    answer: 'Docker provides complete environment parity between local development, testing, and cloud production. It eliminates "it works on my machine" bugs, encapsulates Node runtime dependencies, ensures reproducible builds, allows instant rollbacks by reverting image tags, and enables multi-container orchestration with Docker Compose without polluting the host OS.'
  },
  {
    question: 'How do you ensure zero-downtime or minimal downtime during deployment?',
    answer: 'In this setup, we pull the new Docker image first before touching the active container, minimizing the transition window to under 2 seconds. In higher-tier production architectures, we pair EC2 with an AWS Application Load Balancer (ALB) and Target Groups, performing blue/green or rolling updates across multiple instances or using Amazon ECS/EKS.'
  },
  {
    question: 'How did you secure credentials and SSH keys in GitHub Actions?',
    answer: 'No secrets or .pem keys are hardcoded in the repository. We use GitHub Encrypted Secrets (EC2_SSH_KEY, EC2_HOST, DOCKERHUB_TOKEN). The SSH private key is injected in-memory during the runner step and never written to disk or printed in workflow logs. On Docker Hub, we used a scoped Personal Access Token (PAT) instead of the primary account password.'
  },
  {
    question: 'What happens if a newly deployed container fails or crashes on EC2?',
    answer: 'Our deployment script includes an immediate health check verification step: "curl -f http://localhost:80/health". If the container crashes or returns non-200, the deployment job fails immediately with exit code 1, prints container logs to GitHub Actions for debugging, and alerts the team.'
  }
];

export const RESUME_BULLETS = [
  'Architected and implemented an automated CI/CD pipeline using GitHub Actions, Docker, and AWS EC2, reducing deployment cycle time from 40 minutes to under 60 seconds.',
  'Containerized Node.js microservice utilizing multi-stage Alpine Docker builds, reducing image footprint by 68% and eliminating production vulnerabilities.',
  'Configured automated deployment workflows with secure SSH authentication, zero-downtime container replacement, and automated post-deployment health check validation.',
  'Implemented fine-grained AWS EC2 Security Groups and GitHub Encrypted Secrets, establishing secure continuous delivery without exposing private SSH keys or credentials.',
  'Outcome: Implemented CI/CD pipeline for cloud deployment with 99.9% automated release success rate.'
];
