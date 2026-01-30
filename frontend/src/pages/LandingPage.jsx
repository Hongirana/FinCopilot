import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a4d5e] relative overflow-hidden flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[100px] animate-pulse animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(79,209,197,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,209,197,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold">
                <span className="text-white space-left-2 space-right-2">Fin</span>
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Copilot</span>
              </span>
            </div>
            
            <nav className="flex items-center space-x-2 sm:space-x-4">
              {!isAuthenticated && (
                <>
                  <Link 
                    to="/login" 
                    className="px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-xl font-semibold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-200 transform hover:scale-105"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link 
                  to="/dashboard" 
                  className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-200 transform hover:scale-105"
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Flex Centered */}
      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Title */}
        <div className="w-full text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-3 sm:mb-4">
            <span className="text-white">Fin</span>
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">Copilot</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 font-light tracking-wide">
            Your AI-Powered Financial Guide
          </p>
        </div>

        {/* Hero Card - Absolutely Centered */}
        <div className="w-full flex justify-center mb-8 sm:mb-10">
          <div className="w-full max-w-5xl px-4">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-yellow-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              
              {/* Main card */}
              <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-1 border border-white/10 shadow-2xl">
                <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-3xl"></div>
                  
                  {/* AI Brain Visualization - Centered with Flex */}
                  <div className="relative h-64 md:h-80 lg:h-96 flex items-center justify-center">
                    {/* Central glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-yellow-400/30 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                    
                    {/* Brain circuit - Centered */}
                    <div className="relative z-10">
                      <div className="w-48 h-48 md:w-60 md:h-60 relative">
                        {/* Outer rings */}
                        <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute inset-3 border-2 border-cyan-500/30 rounded-full"></div>
                        
                        {/* Circuit pattern */}
                        <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
                          <path d="M40 60 Q60 40, 100 50 T160 60" stroke="url(#grad1)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="animate-draw" />
                          <path d="M30 100 Q50 90, 100 100 T170 100" stroke="url(#grad2)" strokeWidth="2.5" strokeDasharray="200" strokeDashoffset="200" className="animate-draw" style={{ animationDelay: '0.5s' }} />
                          <path d="M40 140 Q70 130, 100 140 T160 140" stroke="url(#grad3)" strokeWidth="2" strokeDasharray="200" strokeDashoffset="200" className="animate-draw" style={{ animationDelay: '1s' }} />
                          
                          <circle cx="60" cy="55" r="5" fill="#4fd1c5" className="animate-pulse" />
                          <circle cx="100" cy="50" r="6" fill="#d4af37" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                          <circle cx="140" cy="60" r="5" fill="#4fd1c5" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                          <circle cx="50" cy="100" r="6" fill="#d4af37" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
                          <circle cx="100" cy="100" r="7" fill="#4fd1c5" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
                          <circle cx="150" cy="100" r="6" fill="#d4af37" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
                          
                          <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#d4af37" stopOpacity="0.8" />
                            </linearGradient>
                            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0.9" />
                            </linearGradient>
                            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#d4af37" stopOpacity="0.8" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Floating Icons */}
                    {/* Map icon - left */}
                    <div className="absolute left-4 md:left-16 top-1/2 transform -translate-y-1/2 animate-float">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/50 border-2 border-yellow-300/30">
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Dollar icon - right top */}
                    <div className="absolute right-8 md:right-20 top-1/4 animate-float animation-delay-2000">
                      <div className="w-14 h-14 md:w-18 md:h-18 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/50 border-2 border-cyan-300/30">
                        <span className="text-white text-xl md:text-2xl font-bold">$</span>
                      </div>
                    </div>

                    {/* Chart icon - right bottom */}
                    <div className="absolute right-12 md:right-28 bottom-8 animate-float animation-delay-4000">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-2xl shadow-yellow-500/50 transform rotate-6 border-2 border-yellow-300/30">
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="w-full flex justify-center mb-10 sm:mb-12">
          <button
            onClick={handleGetStarted}
            className="group relative inline-flex items-center justify-center px-12 md:px-16 py-3.5 md:py-4 text-lg md:text-xl font-bold text-white transition-all duration-300 ease-in-out"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl transform transition-transform duration-300 group-hover:scale-110"></span>
            <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-300"></span>
            <span className="relative flex items-center space-x-2">
              <span>Get Started</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>

        {/* Features Section */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-6xl px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 text-center">AI-Powered Insights</h3>
                  <p className="text-gray-400 text-sm text-center leading-relaxed">Get intelligent financial advice powered by advanced AI algorithms</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 text-center">Secure & Private</h3>
                  <p className="text-gray-400 text-sm text-center leading-relaxed">Bank-level encryption to keep your financial data safe and secure</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative sm:col-span-2 lg:col-span-1">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 text-center">Smart Analytics</h3>
                  <p className="text-gray-400 text-sm text-center leading-relaxed">Track spending, analyze trends, and optimize your financial health</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative flex justify-center z-10 w-full px-4 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto  text-center text-gray-400 text-sm">
          <p>&copy; 2026 FinCopilot. Your AI-Powered Financial Guide.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
