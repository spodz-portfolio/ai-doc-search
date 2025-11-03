# Security Configuration for GitHub Actions

## Required Secrets

To run the CI/CD pipelines successfully, you need to configure the following secrets in your GitHub repository:

### Navigate to: Settings > Secrets and Variables > Actions

#### Docker Hub (Optional - for container deployment)
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

#### Deployment Secrets (Configure based on your deployment strategy)
- `STAGING_DEPLOY_KEY`: SSH key or deployment token for staging environment
- `PRODUCTION_DEPLOY_KEY`: SSH key or deployment token for production environment

#### Notification Secrets (Optional)
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- `DISCORD_WEBHOOK_URL`: Discord webhook for notifications

#### API Keys (if needed for your application)
- `OPENAI_API_KEY`: OpenAI API key for your backend
- `GOOGLE_DRIVE_API_KEY`: Google Drive API credentials

## Environment Configuration

### Staging Environment
1. Go to Settings > Environments
2. Create environment named `staging`
3. Configure protection rules if needed
4. Add environment-specific secrets

### Production Environment
1. Go to Settings > Environments  
2. Create environment named `production`
3. **Enable "Required reviewers"** - Add yourself and team members
4. **Enable "Wait timer"** - Set to 5-10 minutes for safety
5. Add production-specific secrets

## Branch Protection Rules

Recommended branch protection for `main`/`master`:
1. Go to Settings > Branches
2. Add rule for `main` or `master`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Allow force pushes (only for admins if needed)

## Security Best Practices

1. **Never commit secrets** to your repository
2. **Use environment-specific secrets** for different deployment stages
3. **Enable dependabot** for automated security updates
4. **Review pull requests** before merging
5. **Use signed commits** for additional security
6. **Enable vulnerability alerts** in repository settings

## Monitoring and Alerts

Consider setting up:
- **Code scanning alerts** (GitHub Advanced Security)
- **Dependency vulnerability alerts**
- **Secret scanning alerts**
- **Branch protection rule violations alerts**

## Manual Steps Required

After setting up the workflows:

1. **Configure secrets** as listed above
2. **Set up environments** (staging, production) 
3. **Configure branch protection** rules
4. **Test the workflows** with a test PR
5. **Customize notification** endpoints in workflows
6. **Review and adjust** deployment scripts for your infrastructure

## Troubleshooting

If workflows fail:
1. Check the Actions tab for detailed logs
2. Verify all required secrets are configured
3. Ensure branch names match (main vs master)
4. Check file paths in workflow triggers
5. Verify Docker configurations if using containers