import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';

// Initialize Sentry
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && !sentryDsn.includes('your_sentry_dsn_here')) {
    Sentry.init({
        dsn: sentryDsn,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}

// Initialize LogRocket
const logRocketAppId = import.meta.env.VITE_LOGROCKET_APP_ID;
if (logRocketAppId && !logRocketAppId.includes('your_logrocket_app_id_here')) {
    LogRocket.init(logRocketAppId);

    // Link LogRocket session to Sentry
    if (sentryDsn && !sentryDsn.includes('your_sentry_dsn_here')) {
        LogRocket.getSessionURL(sessionURL => {
            Sentry.getCurrentScope().setExtra("sessionURL", sessionURL);
        });
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
