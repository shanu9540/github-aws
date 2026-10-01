import JSZip from 'jszip';
import { ProjectConfig } from '../types/pipeline';
import {
  generateDockerfile,
  generateDockerCompose,
  generateGithubWorkflow,
  generateEc2SetupScript,
  generateServerJs,
  generatePackageJson,
  generateJenkinsfile,
  generateDockerignore,
  generateReadme,
} from '../data/projectData';
import {
  generateTerraformMain,
  generateTerraformVariables,
  generateTerraformOutputs,
  generateEcrOidcWorkflow,
  generateNginxConfig,
  generateMultiContainerCompose,
  generateCloudWatchConfig,
} from '../data/awsAdvancedFeatures';

export async function exportProjectZip(config: ProjectConfig): Promise<void> {
  const zip = new JSZip();

  // Root files
  zip.file('Dockerfile', generateDockerfile(config));
  zip.file('.dockerignore', generateDockerignore());
  zip.file('docker-compose.yml', generateDockerCompose(config));
  zip.file('docker-compose.prod.yml', generateMultiContainerCompose(config));
  zip.file('setup-ec2.sh', generateEc2SetupScript(config));
  zip.file('server.js', generateServerJs(config));
  zip.file('package.json', generatePackageJson(config));
  zip.file('Jenkinsfile', generateJenkinsfile(config));
  zip.file('amazon-cloudwatch-agent.json', generateCloudWatchConfig());
  zip.file('README.md', generateReadme(config));
  zip.file(
    '.env.example',
    `PORT=${config.appPort}\nNODE_ENV=production\nAPP_VERSION=1.0.0\n`
  );

  // GitHub Actions workflow folder
  const githubFolder = zip.folder('.github');
  const workflowsFolder = githubFolder?.folder('workflows');
  workflowsFolder?.file('deploy.yml', generateGithubWorkflow(config));
  workflowsFolder?.file('deploy-aws-ecr-oidc.yml', generateEcrOidcWorkflow(config));

  // Terraform IaC folder
  const terraformFolder = zip.folder('terraform');
  terraformFolder?.file('main.tf', generateTerraformMain(config));
  terraformFolder?.file('variables.tf', generateTerraformVariables(config));
  terraformFolder?.file('outputs.tf', generateTerraformOutputs());

  // Nginx configuration folder
  const nginxFolder = zip.folder('nginx');
  nginxFolder?.file('nginx.conf', generateNginxConfig(config));

  // Generate blob and trigger browser download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${config.appName}-aws-enterprise-cicd.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

