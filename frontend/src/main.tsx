import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Login from './components/Login.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

const queryClient = new QueryClient()

function AppShell() {
  const { isLoggedIn } = useAuth()

  return isLoggedIn ? <App /> : <Login />
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
