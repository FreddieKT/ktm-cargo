# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for Continuous Integration and Continuous Deployment.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:** Push to `main` or `develop`, Pull Requests

| Job | Description |
|-----|-------------|
| **Lint** | Runs ESLint and Prettier check |
| **Test** | Runs Jest unit tests with coverage |
| **Build** | Verifies production build works |
| **Security** | Runs npm audit and Snyk scan |
| **Analyze** | Bundle size analysis (main only) |

### 2. Deploy Pipeline (`deploy.yml`)

**Triggers:** Push to `main` (production) or `develop` (staging)

| Environment | Branch | Description |
|-------------|--------|-------------|
| **Staging** | `develop` | Preview environment |
| **Production** | `main` | Live environment |

### 3. Release Pipeline (`release.yml`)

**Triggers:** Push of version tags (e.g., `v1.0.0`)

- Creates GitHub Release
- Generates changelog
- Uploads build artifacts

### 4. PR Check (`pr-check.yml`)

**Triggers:** Pull Request opened/updated

- PR size labeling
- Commit message validation
- Build preview deployment
- Code quality checks

## Required Secrets

Configure these in **GitHub → Settings → Secrets and variables → Actions**:

### Required
| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Optional (for deployment)
| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `NETLIFY_AUTH_TOKEN` | Netlify auth token (if using Netlify) |
| `NETLIFY_SITE_ID` | Netlify site ID |

### Optional (for monitoring)
| Secret | Description |
|--------|-------------|
| `SENTRY_AUTH_TOKEN` | Sentry authentication token |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `SNYK_TOKEN` | Snyk API token |
| `CODECOV_TOKEN` | Codecov token |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications |

## Setting Up Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Link project: `vercel link`
3. Get credentials:
   ```bash
   # Get org and project IDs
   cat .vercel/project.json
   ```
4. Create token: [Vercel Tokens](https://vercel.com/account/tokens)
5. Add secrets to GitHub

## Setting Up Staging Environment

1. Create `develop` branch:
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

2. Configure staging Supabase project (optional)
3. Add `STAGING_SUPABASE_URL` and `STAGING_SUPABASE_ANON_KEY` secrets

## Creating a Release

```bash
# Tag and push
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

The release workflow will automatically:
- Run tests
- Build the application
- Create GitHub release
- Generate changelog
- Upload artifacts

## Dependabot

Automatic dependency updates are configured:
- **npm packages:** Weekly on Monday
- **GitHub Actions:** Weekly on Monday

PRs are auto-labeled and grouped by type.

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## Troubleshooting

### Build fails in CI
- Check environment variables are set
- Verify `npm ci` works locally
- Check for TypeScript errors

### Tests fail
- Run `npm test` locally
- Check for missing mocks
- Ensure test environment is configured

### Deployment fails
- Verify deployment secrets are correct
- Check Vercel/Netlify project configuration
- Review deployment logs
