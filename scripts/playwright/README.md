# Playwright Workflow Automation

Automated workflow script:

- `scripts/playwright/client_portal_workflow.sh`

This script uses the Codex Playwright wrapper (`$PWCLI`) and writes artifacts to:

- `output/playwright/client-portal-workflow/`

## Run steps

1. Start the app:

```bash
npm run dev
```

2. In a second terminal, run the public workflow:

```bash
npm run playwright:client-portal
```

3. To include sign-in and post-login navigation, provide credentials:

```bash
PORTAL_EMAIL="you@example.com" \
PORTAL_PASSWORD="your-password" \
npm run playwright:client-portal
```

## Optional environment variables

- `APP_URL` (default: `http://localhost:5173`)
- `HEADED` (`true` or `false`, default: `false`)
- `PLAYWRIGHT_CLI_SESSION` (default: auto-generated session name)
- `RESET_SESSION` (`true` or `false`, default: `true`)
- `ARTIFACT_DIR` (default: `output/playwright/client-portal-workflow`)
