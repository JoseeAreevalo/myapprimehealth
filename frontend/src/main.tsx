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
import ClientNutritionPage from './pages/ClientNutritionPage.tsx'
import ClientTrainingPage from './pages/ClientTrainingPage.tsx'
import ClientReviewPage from './pages/ClientReviewPage.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

const queryClient = new QueryClient()

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
        <Route element={<ClientNutritionPage />} path="clients/nutrition" />
        <Route element={<ClientTrainingPage />} path="clients/training" />
        <Route element={<ClientReviewPage />} path="clients/review" />
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
