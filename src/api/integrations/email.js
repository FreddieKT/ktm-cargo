export const sendEmail = async (params) => {
    const enableEmail = import.meta.env.VITE_ENABLE_EMAIL === 'true';

    if (!enableEmail) {
        console.log('MOCK EMAIL SENT:', params);
        return { success: true, mock: true };
    }

    // Placeholder for real email integration (e.g., SendGrid, AWS SES)
    // const response = await fetch('...', { ... });

    console.warn('Real email sending is enabled but not implemented yet.');
    throw new Error('Email integration not implemented');
};
