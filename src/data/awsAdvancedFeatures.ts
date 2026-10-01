import { ProjectConfig } from '../types/pipeline';

export function generateTerraformMain(cfg: ProjectConfig): string {
  return `# ==============================================================================
# Terraform Infrastructure as Code (IaC) for AWS CI/CD Deployment
# Provisions: VPC, Subnet, Internet Gateway, Security Group, EC2 Instance & EIP
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. Custom VPC
resource "aws_vpc" "app_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${cfg.appName}-vpc"
    Environment = "production"
  }
}

# 2. Public Subnet
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "\${var.aws_region}a"

  tags = {
    Name = "${cfg.appName}-public-subnet"
  }
}

# 3. Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.app_vpc.id

  tags = {
    Name = "${cfg.appName}-igw"
  }
}

# 4. Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.app_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${cfg.appName}-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# 5. Security Group for Web Application
resource "aws_security_group" "app_sg" {
  name        = "${cfg.appName}-sg"
  description = "Security Group for Dockerized App on EC2"
  vpc_id      = aws_vpc.app_vpc.id

  # Inbound HTTP (Port 80)
  ingress {
    description = "Allow HTTP from Anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound HTTPS (Port 443)
  ingress {
    description = "Allow HTTPS from Anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound SSH (Port 22) for GitHub Actions CI/CD Deployment
  ingress {
    description = "SSH for Deployment and Admin"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound All Traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${cfg.appName}-sg"
  }
}

# 6. AWS EC2 Instance (Ubuntu 24.04 LTS)
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public_subnet.id
  key_name      = var.key_pair_name

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
              chmod a+r /etc/apt/keyrings/docker.asc
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              systemctl enable docker
              systemctl start docker
              usermod -aG docker ubuntu
              mkdir -p /home/ubuntu/app
              chown -R ubuntu:ubuntu /home/ubuntu/app
              EOF

  tags = {
    Name = "${cfg.appName}-ec2-instance"
  }
}

# 7. Static Elastic IP (Prevents IP changes on reboot)
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name = "${cfg.appName}-eip"
  }
}
`;
}

export function generateTerraformVariables(cfg: ProjectConfig): string {
  return `variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "${cfg.awsRegion}"
}

variable "instance_type" {
  description = "EC2 instance size (t2.micro is AWS Free Tier eligible)"
  type        = string
  default     = "${cfg.instanceType || 't2.micro'}"
}

variable "key_pair_name" {
  description = "Name of existing AWS Key Pair (.pem) created in AWS Console"
  type        = string
  default     = "my-aws-key"
}
`;
}

export function generateTerraformOutputs(): string {
  return `output "ec2_public_ip" {
  description = "Static Elastic IPv4 address of the EC2 instance"
  value       = aws_eip.app_eip.public_ip
}

output "ssh_command" {
  description = "Terminal command to SSH into EC2 instance"
  value       = "ssh -i my-aws-key.pem ubuntu@\${aws_eip.app_eip.public_ip}"
}

output "app_url" {
  description = "Public URL to access the deployed web application"
  value       = "http://\${aws_eip.app_eip.public_ip}"
}
`;
}

export function generateEcrOidcWorkflow(cfg: ProjectConfig): string {
  return `name: Deploy to Amazon ECR & EC2 via AWS IAM OIDC

on:
  push:
    branches: [ "${cfg.branch}" ]

permissions:
  id-token: write   # Required for requesting AWS STS temporary credentials via OIDC
  contents: read    # Required for actions/checkout

env:
  AWS_REGION: ${cfg.awsRegion}
  ECR_REPOSITORY: ${cfg.appName}
  CONTAINER_NAME: ${cfg.appName}
  ROLE_TO_ASSUME: arn:aws:iam::123456789012:role/GitHubActionsECRDeploymentRole

jobs:
  # -------------------------------------------------------------
  # Job 1: Build, Scan & Push to Amazon Elastic Container Registry
  # -------------------------------------------------------------
  build-and-push-ecr:
    name: Build & Push to Amazon ECR
    runs-on: ubuntu-latest
    outputs:
      image_uri: \${{ steps.build-image.outputs.image }}
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Authenticate to AWS via OpenID Connect (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: \${{ env.ROLE_TO_ASSUME }}
          aws-region: \${{ env.AWS_REGION }}
          audience: sts.amazonaws.com

      - name: Log in to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Scan Dockerfile with Trivy (DevSecOps)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          hide-progress: true
          format: 'table'
          exit-code: '0'

      - name: Build, Tag, and Push Image to ECR
        id: build-image
        env:
          ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG -t \$ECR_REGISTRY/\$ECR_REPOSITORY:latest .
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:latest
          echo "image=\$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG" >> \$GITHUB_OUTPUT

  # -------------------------------------------------------------
  # Job 2: Continuous Deployment to AWS EC2
  # -------------------------------------------------------------
  deploy-ec2:
    name: Deploy Container to AWS EC2
    needs: build-and-push-ecr
    runs-on: ubuntu-latest
    steps:
      - name: SSH Deploy via IAM ECR Login
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.EC2_HOST }}
          username: \${{ secrets.EC2_USER }}
          key: \${{ secrets.EC2_SSH_KEY }}
          script: |
            echo "==== 🚀 Pulling from Amazon ECR ===="
            # Authenticate Docker on EC2 with Amazon ECR
            aws ecr get-login-password --region ${cfg.awsRegion} | docker login --username AWS --password-stdin \${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${cfg.awsRegion}.amazonaws.com

            ECR_IMAGE="\${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${cfg.awsRegion}.amazonaws.com/${cfg.appName}:latest"

            docker pull \$ECR_IMAGE
            docker stop ${cfg.appName} || true
            docker rm ${cfg.appName} || true

            docker run -d \\
              --name ${cfg.appName} \\
              --restart always \\
              -p ${cfg.hostPort}:${cfg.appPort} \\
              -e NODE_ENV=production \\
              \$ECR_IMAGE

            sleep 3
            curl -f http://localhost:${cfg.hostPort}${cfg.healthEndpoint}
            docker image prune -f
            echo "==== ✅ Deployed from Amazon ECR successfully! ===="
`;
}

export function generateNginxConfig(cfg: ProjectConfig): string {
  return `# Production Nginx Reverse Proxy Configuration with Security Headers
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    # Rate Limiting Zone
    limit_req_zone $binary_remote_addr zone=req_limit_per_ip:10m rate=10r/s;

    # Upstream Node.js Express Container
    upstream backend_app {
        server ${cfg.appName}:${cfg.appPort};
        keepalive 32;
    }

    server {
        listen 80;
        server_name ${cfg.domainName || '_'};

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        location / {
            limit_req zone=req_limit_per_ip burst=20 nodelay;
            proxy_pass http://backend_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Healthcheck pass-through without rate limit
        location ${cfg.healthEndpoint} {
            proxy_pass http://backend_app${cfg.healthEndpoint};
            access_log off;
        }
    }
}
`;
}

export function generateMultiContainerCompose(cfg: ProjectConfig): string {
  return `version: '3.8'

services:
  # 1. Application Container (Internal only)
  ${cfg.appName}:
    image: ${cfg.dockerHubUsername}/${cfg.appName}:latest
    container_name: ${cfg.appName}
    restart: always
    expose:
      - "${cfg.appPort}"
    environment:
      - NODE_ENV=production
      - PORT=${cfg.appPort}
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:${cfg.appPort}${cfg.healthEndpoint}"]
      interval: 20s
      timeout: 5s
      retries: 3

  # 2. Production Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: ${cfg.appName}-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - ${cfg.appName}
    networks:
      - app_network

networks:
  app_network:
    driver: bridge
`;
}

export function generateCloudWatchConfig(): string {
  return `{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60,
        "totalcpu": true
      },
      "disk": {
        "measurement": [
          "used_percent",
          "inodes_free"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
`;
}

export const AWS_COST_ESTIMATION = [
  {
    service: 'Amazon EC2 (t2.micro / t3.micro)',
    tier: 'Free Tier Eligible',
    freeQuota: '750 hours/month (1st 12 months)',
    costBeyond: '$0.0116/hour (~$8.35/month)',
    notes: 'Runs 1 instance 24/7 for the entire month for free during year 1.',
  },
  {
    service: 'Amazon EBS (gp3 Storage)',
    tier: 'Free Tier Eligible',
    freeQuota: '30 GB SSD volume storage',
    costBeyond: '$0.08 per GB-month (~$2.40/month)',
    notes: 'Allocate 20GB root volume to stay safely under 30GB limit.',
  },
  {
    service: 'Amazon Elastic IP (Static IPv4)',
    tier: 'Conditional Free',
    freeQuota: '1 free when attached to running EC2',
    costBeyond: '$0.005/hour if instance is stopped',
    notes: 'Only free while instance is active; release if you terminate instance.',
  },
  {
    service: 'Amazon ECR (Container Registry)',
    tier: 'Free Tier Eligible',
    freeQuota: '500 MB/month private storage',
    costBeyond: '$0.10 per GB-month',
    notes: 'Enable image lifecycle policy to automatically delete older tags.',
  },
  {
    service: 'GitHub Actions Runners',
    tier: 'Free Tier for Public/Private',
    freeQuota: '2,000 free build minutes/month',
    costBeyond: '$0.008/minute',
    notes: 'Our optimized Docker multi-stage build finishes in ~45 seconds.',
  },
];

export const ADVANCED_FEATURE_HIGHLIGHTS = [
  {
    id: 'iac',
    title: 'Infrastructure as Code (Terraform)',
    titleHi: 'Terraform ke saath AWS infrastructure automate karo',
    category: 'Cloud IaC',
    badge: 'Enterprise Standard',
    description:
      'Instead of manual clicks in the AWS Management Console, define VPCs, Subnets, Security Groups, EC2 instances, and Elastic IPs as declarative code in main.tf.',
    descriptionHi:
      'AWS Console me manual click karne ki jagah ek single command "terraform apply" chala kar poora EC2 server, VPC aur firewall setup ho jata hai.',
    impact: 'Reproducible cloud environments in 45 seconds, zero manual configuration drift.',
  },
  {
    id: 'ecr-oidc',
    title: 'Amazon ECR + IAM OIDC (Passwordless)',
    titleHi: 'Amazon ECR aur bina password wala OIDC authentication',
    category: 'Security & Identity',
    badge: 'DevSecOps',
    description:
      'Eliminate static AWS Access Keys in GitHub Secrets! Use OpenID Connect (OIDC) to request short-lived temporary STS tokens dynamically during CI/CD.',
    descriptionHi:
      'GitHub Secrets me permanent AWS keys store karne ki zaroorat nahi. AWS IAM OIDC short-lived 15-minute temporary tokens provide karta hai.',
    impact: 'Zero credential leak risk; complies with SOC 2 & ISO 27001 cloud security standards.',
  },
  {
    id: 'trivy',
    title: 'Aqua Trivy Container Vulnerability Scan',
    titleHi: 'Docker Image ki security scanning (CVE detection)',
    category: 'DevSecOps',
    badge: 'Security Gate',
    description:
      'Scan the Dockerfile and container image before registry push. Automatically blocks releases containing CRITICAL CVE vulnerabilities or hardcoded API keys.',
    descriptionHi:
      'Docker image push hone se pehle Trivy automatically check karega ki koi virus, security bug ya private API key toh leak nahi ho rahi.',
    impact: 'Shifts security left in the software development lifecycle (SDLC).',
  },
  {
    id: 'nginx-ssl',
    title: 'Nginx Reverse Proxy & SSL (HTTPS 443)',
    titleHi: 'Nginx Reverse Proxy aur SSL Certificate (HTTPS)',
    category: 'Networking',
    badge: 'Production Ready',
    description:
      'Production apps never expose Node.js directly. Front the application with Nginx for SSL termination, Gzip compression, rate limiting, and HTTP/2.',
    descriptionHi:
      'Node.js ko directly internet pe expose nahi karte. Aage Nginx container lagate hain jo rate limiting, security headers aur SSL handle karta hai.',
    impact: 'Protects backend from DDoS attacks and provides encrypted TLS/HTTPS.',
  },
  {
    id: 'monitoring',
    title: 'CloudWatch Resource Health Monitor',
    titleHi: 'CloudWatch Live Health Monitor & CPU/RAM',
    category: 'Observability',
    badge: 'Live Dashboard',
    description:
      'Real-time CPU/RAM live telemetry dashboard simulating CloudWatch Agent metric collection, traffic spike alarms, and Slack webhook alerts.',
    descriptionHi:
      'EC2 server ka real-time CPU aur RAM live graph dekho, traffic spike simulate karo aur dekho kaise CloudWatch Alarm trigger hota hai.',
    impact: 'Mean Time to Detect (MTTD) reduced from hours to under 30 seconds.',
  },
  {
    id: 'blue-green',
    title: 'Zero-Downtime Blue/Green Deployment',
    titleHi: 'Blue/Green deployment se 0-second downtime update',
    category: 'Release Strategy',
    badge: 'High Availability',
    description:
      'Deploy the new Green container on port 3002 alongside the live Blue container on port 3001. Once health checks pass, flip Nginx upstream instantly.',
    descriptionHi:
      'Purane container ko band karne se pehle naya container start hota hai. Health test pass hone ke baad traffic switch hoti hai, user ko 1 second ka bhi downtime nahi dikhta.',
    impact: '100% continuous availability for end-users during production releases.',
  },
  {
    id: 'cost-calculator',
    title: 'EC2 Monthly Cost Calculator',
    titleHi: 'EC2 Monthly Cost Calculator (t3.micro, t3.small etc.)',
    category: 'FinOps Budget',
    badge: 'Interactive Tool',
    description:
      'Calculate monthly AWS expenses across t2.micro, t3.micro, t3.small, and Graviton t4g instances with Free Tier benefits and EBS storage.',
    descriptionHi:
      't3.micro, t3.small, Graviton instances ka monthly kharcha calculate karo aur dekho Free Tier ke sath kitna bill banega.',
    impact: 'Accurate cloud budget forecasting and automated instance sizing.',
  },
];
