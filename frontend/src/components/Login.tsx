import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { darkMode } = useTheme();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) setError(errorMsg);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Request failed');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pt-20 ${darkMode ? 'bg-dark' : 'bg-gray-100'} flex items-center justify-center px-4 transition-colors duration-300`}>
      <div className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 transition-colors duration-300`}>
        {/* Tabs */}
        <div className="flex mb-6 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-primary text-white'
                : darkMode ? 'text-gray-400 hover:text-light' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-primary text-white'
                : darkMode ? 'text-gray-400 hover:text-light' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Register
          </button>
        </div>

        <h2 className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-6`}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-md p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className={`block text-sm ${darkMode ? 'text-light' : 'text-gray-700'} mb-1`}>
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300'} border rounded px-3 py-2 focus:border-primary focus:outline-none`}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className={`block text-sm ${darkMode ? 'text-light' : 'text-gray-700'} mb-1`}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300'} border rounded px-3 py-2 focus:border-primary focus:outline-none`}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm ${darkMode ? 'text-light' : 'text-gray-700'} mb-1`}>
              Password {mode === 'register' && <span className="text-gray-400">(min 8 chars)</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300'} border rounded px-3 py-2 focus:border-primary focus:outline-none`}
              required
              minLength={mode === 'register' ? 8 : undefined}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-accent disabled:opacity-50 text-white py-2 px-4 rounded transition-colors font-medium mt-2"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}