import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import FarmerDashboard from './components/FarmerDashboard';
import BPADashboard from './components/BPADashboard';
import { farmerApi } from './services/api';

type View = 'landing' | 'auth' | 'farmer_dashboard' | 'bpa_dashboard';

function App() {
  const [view, setView] = useState<View>(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('user_role');
    if (token && savedRole) {
      return savedRole === 'bpa' ? 'bpa_dashboard' : ('farmer_dashboard' as View);
    }
    return 'landing';
  });

  useEffect(() => {
    // Verify session on mount if token exists
    const token = localStorage.getItem('token');
    if (token) {
      farmerApi.getProfile()
        .then(res => {
          const user = res.data;
          const roleView = user.role === 'bpa' ? 'bpa_dashboard' : 'farmer_dashboard';
          setView(roleView as View);
          localStorage.setItem('user_role', user.role);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user_role');
          setView('landing');
        });
    }
  }, []);

  useState(() => {
    // Initial theme setup directly in render for immediate effect
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    return undefined;
  });

  const handleGetStarted = () => setView('auth');
  const handleBackToLanding = () => setView('landing');

  const handleLoginSuccess = (role: 'farmer' | 'bpa') => {
    localStorage.setItem('user_role', role);
    setView(role === 'farmer' ? 'farmer_dashboard' : 'bpa_dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    setView('landing');
  };

  return (
    <div className="app-container">
      {view === 'landing' && <LandingPage onGetStarted={handleGetStarted} />}
      {view === 'auth' && (
        <AuthPage
          onBack={handleBackToLanding}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {view === 'farmer_dashboard' && <FarmerDashboard onLogout={handleLogout} />}
      {view === 'bpa_dashboard' && <BPADashboard onLogout={handleLogout} />}
    </div>
  );
}

export default App;
