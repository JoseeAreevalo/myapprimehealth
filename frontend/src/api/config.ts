// Add runtime config type definition
declare global {
    interface Window {
        RUNTIME_CONFIG?: {
            API_URL: string;
        };
    }
}

const getBaseUrl = () => {
    // First check runtime configuration (from runtime-config.js)
    if (typeof window !== 'undefined' && window.RUNTIME_CONFIG?.API_URL) {
        console.log('Using runtime config API_URL:', window.RUNTIME_CONFIG.API_URL);
        return window.RUNTIME_CONFIG.API_URL;
    }
    
    // Check if we're in a Codespace
    const codespaceName = process.env.CODESPACE_NAME;
    if (codespaceName) {
        // Use the same protocol as the current page
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
        const protocolToUse = protocol.includes('https') ? 'https' : 'http';
        console.log(`Using Codespace URL with ${protocolToUse} protocol`);
        return `${protocolToUse}://${codespaceName}-3000.app.github.dev`;
    }
    
    // Auto-detect protocol for local development
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const protocolToUse = protocol.includes('https') ? 'https' : 'http';
    console.log(`Using default localhost URL with ${protocolToUse} protocol`);
    return `${protocolToUse}://localhost:3000`;
};

export const API_BASE_URL = getBaseUrl();

export const api = {
    baseURL: API_BASE_URL,
    endpoints: {
        authRegister: '/api/v1/identity/register',
        authLogin: '/api/v1/identity/login',
        authMe: '/api/v1/identity/me',
        authRefresh: '/api/v1/identity/refresh',
        authLogout: '/api/v1/identity/logout',
        myProfile: '/api/v1/people/me/profile',
        coachClients: (coachId: number) => `/api/v1/people/coaches/${coachId}/clients`,
        clientCoach: (clientId: number) => `/api/v1/people/clients/${clientId}/coach`,
        coachAssignments: '/api/v1/people/coach-assignments',
        nutritionPlans: (clientId: number) => `/api/v1/nutrition/clients/${clientId}/plans`,
        nutritionToday: (clientId: number) => `/api/v1/nutrition/clients/${clientId}/today`,
        nutritionActivatePlan: (clientId: number, planId: number) => `/api/v1/nutrition/clients/${clientId}/plans/${planId}/activate`,
        nutritionPlanCreate: '/api/v1/nutrition/plans',
        nutritionMealLog: (mealId: number) => `/api/v1/nutrition/meals/${mealId}/log`,
        checkInSubmit: '/api/v1/check-ins',
        checkInHistory: (clientId: number) => `/api/v1/check-ins/clients/${clientId}`,
        checkInPending: (coachId: number) => `/api/v1/check-ins/coaches/${coachId}/pending`,
        checkInReview: (id: number) => `/api/v1/check-ins/${id}/review`,
        progress: (clientId: number) => `/api/v1/progress/clients/${clientId}`,
        adminUsers: '/api/v1/administration/users',
        adminUserUpdate: (id: number) => `/api/v1/administration/users/${id}`,
    }
};