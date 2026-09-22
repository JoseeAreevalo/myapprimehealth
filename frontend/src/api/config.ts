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
        nutritionPlanUpdate: (planId: number) => `/api/v1/nutrition/plans/${planId}`,
        nutritionPlanAddMeal: (planId: number) => `/api/v1/nutrition/plans/${planId}/meals`,
        nutritionMealUpdate: (mealId: number) => `/api/v1/nutrition/meals/${mealId}`,
        nutritionMealLog: (mealId: number) => `/api/v1/nutrition/meals/${mealId}/log`,
        nutritionMealItemAdd: (mealId: number) => `/api/v1/nutrition/meals/${mealId}/items`,
        nutritionMealItemDelete: (itemId: number) => `/api/v1/nutrition/meal-items/${itemId}`,
        nutritionMealItemUpdate: (itemId: number) => `/api/v1/nutrition/meal-items/${itemId}`,
        nutritionDayConfigAdd: (planId: number) => `/api/v1/nutrition/plans/${planId}/day-configs`,
        nutritionDayConfigUpdate: (dayConfigId: number) => `/api/v1/nutrition/day-configs/${dayConfigId}`,
        nutritionDayConfigDelete: (dayConfigId: number) => `/api/v1/nutrition/day-configs/${dayConfigId}`,
        checkInSubmit: '/api/v1/check-ins',
        checkInHistory: (clientId: number) => `/api/v1/check-ins/clients/${clientId}`,
        checkInPending: (coachId: number) => `/api/v1/check-ins/coaches/${coachId}/pending`,
        checkInReview: (id: number) => `/api/v1/check-ins/${id}/review`,
        progress: (clientId: number) => `/api/v1/progress/clients/${clientId}`,
        adminUsers: '/api/v1/administration/users',
        adminUserUpdate: (id: number) => `/api/v1/administration/users/${id}`,
        adminUserDelete: (id: number) => `/api/v1/administration/users/${id}`,
        notifications: '/api/v1/notifications',
        notificationRead: (id: number) => `/api/v1/notifications/${id}/read`,
        notificationReadAll: '/api/v1/notifications/read-all',
        notificationPreferences: '/api/v1/notifications/preferences',
        checkInPhotos: (checkInId: number) => `/api/v1/files/check-ins/${checkInId}/photos`,
        fileDownload: (id: number) => `/api/v1/files/${id}`,
        foodsSearch: '/api/v1/foods',
        foodsCreate: '/api/v1/foods',
        foodsBarcode: (code: string) => `/api/v1/foods/barcode/${encodeURIComponent(code)}`,
        hydrationToday: '/api/v1/hydration/today',
        trainingPlan: (clientId: number) => `/api/v1/training/clients/${clientId}/plan`,
        trainingPlanCreate: '/api/v1/training/plans',
        trainingPlanUpdate: (planId: number) => `/api/v1/training/plans/${planId}`,
        trainingPlanAddDay: (planId: number) => `/api/v1/training/plans/${planId}/days`,
        trainingDayDelete: (dayId: number) => `/api/v1/training/days/${dayId}`,
        trainingDayUpdate: (dayId: number) => `/api/v1/training/days/${dayId}`,
        trainingDayAddExercise: (dayId: number) => `/api/v1/training/days/${dayId}/exercises`,
        trainingExerciseUpdate: (exerciseId: number) => `/api/v1/training/exercises/${exerciseId}`,
        trainingExerciseDelete: (exerciseId: number) => `/api/v1/training/exercises/${exerciseId}`,
        trainingExerciseLogs: (exerciseId: number) => `/api/v1/training/exercises/${exerciseId}/logs`,
        trainingHistory: (clientId: number) => `/api/v1/training/clients/${clientId}/history`,
        exercisesSearch: '/api/v1/exercises',
        exercisesCreate: '/api/v1/exercises',
    }
};