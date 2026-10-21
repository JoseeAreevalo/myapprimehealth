import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import AppLayout from './components/AppLayout.tsx'
import Login from './components/Login.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import OverviewPage from './pages/OverviewPage.tsx'
import NutritionPage from './pages/NutritionPage.tsx'
import TrainingPage from './pages/TrainingPage.tsx'
import ProgressPage from './pages/ProgressPage.tsx'
import ClientPlansPage from './pages/ClientPlansPage.tsx'
import ClientReviewPage from './pages/ClientReviewPage.tsx'
import AdminProfilesPage from './pages/AdminProfilesPage.tsx'
import ActivityPage from './pages/ActivityPage.tsx'
import ClientActivityPage from './pages/ClientActivityPage.tsx'
import LearningPage from './pages/LearningPage.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { initNative } from './native.ts'

const queryClient = new QueryClient()

initNative()

function AppShell() {
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) return <Login />

  return (
    <Routes>
      <Route element={<AppLayout />} path="/">
        <Route element={<OverviewPage />} index />
        <Route element={<NutritionPage />} path="nutrition" />
        <Route element={<TrainingPage />} path="training" />
        <Route element={<ProgressPage />} path="progress" />
        <Route element={<ActivityPage />} path="activity" />
        <Route element={<LearningPage />} path="learning" />
        <Route element={<ClientPlansPage />} path="clients/plans" />
        <Route element={<ClientActivityPage />} path="clients/activity" />
        <Route element={<ClientReviewPage />} path="clients/review" />
        <Route element={<AdminProfilesPage />} path="admin/profiles" />
        <Route element={<OverviewPage />} path="*" />
      </Route>
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>,
)
