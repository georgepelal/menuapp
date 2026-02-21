import React, { useState, useEffect } from 'react';
import { AppState, ViewMode, User, ServiceRequest, CustomerLead, CustomerFeedback } from './types';
import AdminDashboard from './components/admin/AdminDashboard';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import PublicMenu from './components/public/PublicMenu';
import QRModal from './components/admin/QRModal';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import { 
  Utensils, Store, Sparkles, Globe, Coffee, Wine, 
  ArrowRight, CheckCircle2, Zap, LayoutTemplate, 
  Smartphone, Star, MousePointerClick, ArrowUpRight,
  QrCode
} from './components/ui/Icons';

// Landing Page Translations
const LANDING_TRANSLATIONS = {
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it works",
      pricing: "Pricing",
      login: "Login",
      startFree: "Start for Free"
    },
    hero: {
      badge: "Trusted by 500+ Venues",
      title: "The Smart Menu Platform for Modern Venues",
      subtitle: "Transform your PDF menu into an interactive, AI-powered digital experience. Increase sales with appetizing descriptions and instant translations.",
      ctaPrimary: "Create Your Menu",
      ctaSecondary: "View Demo",
      noCard: "No credit card required"
    },
    features: {
      ai: { title: "AI Magic", desc: "Generate mouth-watering descriptions and photos instantly." },
      qr: { title: "Dynamic QR", desc: "Update your menu anytime. Keep the same QR code forever." },
      trans: { title: "Auto Translate", desc: "Welcome tourists with menus in 30+ languages." }
    },
    stats: [
      { value: "20%", label: "Increase in Ticket Size" },
      { value: "30+", label: "Languages Supported" },
      { value: "0", label: "Printing Costs" }
    ]
  },
  el: {
    nav: {
      features: "Δυνατότητες",
      howItWorks: "Πώς λειτουργεί",
      pricing: "Τιμολόγηση",
      login: "Σύνδεση",
      startFree: "Δωρεάν Έναρξη"
    },
    hero: {
      badge: "Το εμπιστεύονται 500+ Καταστήματα",
      title: "Η Έξυπνη Πλατφόρμα Μενού για Σύγχρονα Καταστήματα",
      subtitle: "Μετατρέψτε το PDF μενού σας σε μια διαδραστική εμπειρία με AI. Αυξήστε τις πωλήσεις με ελκυστικές περιγραφές και άμεσες μεταφράσεις.",
      ctaPrimary: "Δημιουργία Μενού",
      ctaSecondary: "Δείτε Demo",
      noCard: "Χωρίς πιστωτική κάρτα"
    },
    features: {
      ai: { title: "Μαγεία AI", desc: "Δημιουργήστε λαχταριστές περιγραφές και φωτογραφίες άμεσα." },
      qr: { title: "Δυναμικό QR", desc: "Ενημερώστε το μενού ανά πάσα στιγμή. Κρατήστε το ίδιο QR." },
      trans: { title: "Αυτόματη Μετάφραση", desc: "Υποδεχτείτε τουρίστες με μενού σε 30+ γλώσσες." }
    },
    stats: [
      { value: "20%", label: "Αύξηση Μέσης Παραγγελίας" },
      { value: "30+", label: "Γλώσσες" },
      { value: "0", label: "Κόστος Εκτύπωσης" }
    ]
  }
};

// Initial Data Template
const getInitialData = (businessName = "My Business", langCode = 'en'): AppState => {
  const isGreek = langCode === 'el';
  return {
    profile: {
      name: businessName,
      description: isGreek 
        ? "Καλώς ήρθατε στο ψηφιακό μας μενού."
        : "Welcome to our digital menu.",
      currency: isGreek ? "€" : "$",
      themeColor: "#ea580c",
      themeTemplate: 'modern',
      primaryLanguage: langCode,
      languages: isGreek 
        ? [{ code: 'el', name: 'Greek', flag: '🇬🇷' }]
        : [{ code: 'en', name: 'English', flag: '🇺🇸' }],
      enableSmartWaiter: true,
      enableLeadCapture: true,
      enableFeedback: true
    },
    categories: [],
    items: [],
    stats: {
      totalViews: 0,
      itemClicks: {},
      lastReset: Date.now()
    },
    leads: [],
    serviceRequests: [],
    feedback: []
  };
};

const getDemoData = (): AppState => ({
  profile: {
    name: "Coastal Breeze",
    description: "Artisan coffee, fresh pastries, and sunset cocktails by the sea.",
    currency: "€",
    themeColor: "#0ea5e9",
    themeTemplate: 'modern',
    primaryLanguage: 'en',
    languages: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'el', name: 'Greek', flag: '🇬🇷' }
    ],
    enableSmartWaiter: true,
    enableLeadCapture: true,
    enableFeedback: true
  },
  categories: [
    { id: 'c1', name: 'Best Sellers', order: 0 },
    { id: 'c2', name: 'Brunch', order: 1 },
    { id: 'c3', name: 'Cocktails', order: 2 }
  ],
  items: [
    {
      id: 'i1', categoryId: 'c1', name: 'Freddo Espresso', price: 3.5, isAvailable: true, dietary: ['VG', 'GF'] as any,
      description: 'Double espresso blended with ice, served cold and frothy. The Greek summer staple.',
      image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'i2', categoryId: 'c2', name: 'Avocado Toast', price: 9, isAvailable: true, dietary: ['VG'] as any,
      description: 'Sourdough bread topped with smashed avocado, chili flakes, and lime zest.',
      image: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'i3', categoryId: 'c3', name: 'Aperol Spritz', price: 11, isAvailable: true, dietary: ['VG', 'GF'] as any,
      description: 'Refreshing Prosecco, Aperol, and soda water garnished with an orange slice.',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80'
    }
  ],
  stats: {
    totalViews: 1245,
    itemClicks: { 'i1': 85, 'i2': 62, 'i3': 45 },
    lastReset: Date.now()
  },
  leads: [
    { id: 'l1', email: 'customer@example.com', date: Date.now() - 100000, source: 'popup' }
  ],
  serviceRequests: [
    { id: 'sr1', type: 'bill', status: 'pending', timestamp: Date.now() - 50000, table: '4' }
  ],
  feedback: [
    { id: 'f1', rating: 5, comment: 'Amazing service!', date: Date.now() - 200000 }
  ]
});

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('landing');
  const [data, setData] = useState<AppState>(getInitialData());
  const [showQR, setShowQR] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Landing page language state
  const [landingLang, setLandingLang] = useState<'en' | 'el'>('en');

  // Detect User Location for Language
  useEffect(() => {
    const detectLanguage = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code === 'GR' || data.country_code === 'CY') {
          setLandingLang('el');
          return;
        }
      } catch (error) {
        // Fallback
      }
      if (navigator.language.startsWith('el')) {
        setLandingLang('el');
      }
    };
    detectLanguage();
  }, []);

  // Check for active session
  useEffect(() => {
    const sessionUser = localStorage.getItem('gourmet_qr_session');
    if (sessionUser) {
      const user: User = JSON.parse(sessionUser);
      setCurrentUser(user);
      if (user.email === 'admin@gourmetqr.com') {
        setView('super-admin');
      } else {
        loadUserData(user.email);
        setView('admin');
      }
    }
  }, []);

  const loadUserData = (email: string) => {
    const saved = localStorage.getItem(`gourmet_qr_data_${email}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new arrays exist for old accounts
        if (!parsed.stats) parsed.stats = { totalViews: 0, itemClicks: {}, lastReset: Date.now() };
        if (!parsed.leads) parsed.leads = [];
        if (!parsed.serviceRequests) parsed.serviceRequests = [];
        if (!parsed.feedback) parsed.feedback = [];
        setData(parsed);
      } catch (e) {
        setData(getInitialData());
      }
    } else {
      setData(getInitialData());
    }
  };

  const saveUserData = (newData: AppState) => {
    if (currentUser) {
      setData(newData);
      localStorage.setItem(`gourmet_qr_data_${currentUser.email}`, JSON.stringify(newData));
    } else {
      setData(newData);
    }
  };

  const handlePublicInteraction = (type: string, payload?: any) => {
    const newData = { ...data };
    
    if (type === 'view') {
      newData.stats.totalViews = (newData.stats.totalViews || 0) + 1;
    } 
    else if (type === 'click_item' && payload) {
      newData.stats.itemClicks = { ...newData.stats.itemClicks };
      newData.stats.itemClicks[payload] = (newData.stats.itemClicks[payload] || 0) + 1;
    }
    else if (type === 'lead_submit' && payload) {
      const lead: CustomerLead = {
        id: Date.now().toString(),
        email: payload.email,
        name: payload.name,
        date: Date.now(),
        source: 'menu_popup'
      };
      newData.leads = [lead, ...(newData.leads || [])];
    }
    else if (type === 'service_request' && payload) {
      const request: ServiceRequest = {
        id: Date.now().toString(),
        type: payload.type,
        table: payload.table,
        status: 'pending',
        timestamp: Date.now()
      };
      newData.serviceRequests = [request, ...(newData.serviceRequests || [])];
    }
    else if (type === 'feedback_submit' && payload) {
      const feedback: CustomerFeedback = {
        id: Date.now().toString(),
        rating: payload.rating,
        comment: payload.comment,
        contact: payload.contact,
        date: Date.now()
      };
      newData.feedback = [feedback, ...(newData.feedback || [])];
    }

    saveUserData(newData);
  };

  const handleLogin = (email: string, pass: string): boolean => {
    if (email === 'admin@gourmetqr.com' && pass === 'admin123') {
      const user = { email, name: 'Super Admin' };
      setCurrentUser(user);
      localStorage.setItem('gourmet_qr_session', JSON.stringify(user));
      setView('super-admin');
      return true;
    }

    const usersStr = localStorage.getItem('gourmet_qr_users');
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    if (users[email] && users[email].password === pass) {
      const user = { email, name: users[email].name };
      setCurrentUser(user);
      localStorage.setItem('gourmet_qr_session', JSON.stringify(user));
      loadUserData(email);
      setView('admin');
      return true;
    }
    return false;
  };

  const handleRegister = (email: string, pass: string, name: string): boolean => {
    const usersStr = localStorage.getItem('gourmet_qr_users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (users[email]) return false;

    users[email] = { password: pass, name };
    localStorage.setItem('gourmet_qr_users', JSON.stringify(users));

    const initialData = getInitialData(name, landingLang);
    localStorage.setItem(`gourmet_qr_data_${email}`, JSON.stringify(initialData));
    if (['en', 'el'].includes(landingLang)) {
      localStorage.setItem('gourmet_qr_admin_lang', landingLang);
    }

    const user = { email, name };
    setCurrentUser(user);
    localStorage.setItem('gourmet_qr_session', JSON.stringify(user));
    setData(initialData);
    setView('admin');
    return true;
  };

  const handleDemo = () => {
    const demoUser = { email: 'demo@gourmetqr.com', name: 'Coastal Breeze' };
    const saved = localStorage.getItem(`gourmet_qr_data_${demoUser.email}`);
    if (!saved) {
      const demoData = getDemoData();
      localStorage.setItem(`gourmet_qr_data_${demoUser.email}`, JSON.stringify(demoData));
      setData(demoData);
    } else {
      loadUserData(demoUser.email);
    }
    setCurrentUser(demoUser);
    localStorage.setItem('gourmet_qr_session', JSON.stringify(demoUser));
    setView('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('gourmet_qr_session');
    setCurrentUser(null);
    setView('landing');
    setData(getInitialData());
  };

  const navigateTo = (mode: ViewMode) => {
    setView(mode);
    window.scrollTo(0, 0);
  };

  if (view === 'super-admin') {
    if (!currentUser || currentUser.email !== 'admin@gourmetqr.com') {
       setTimeout(() => setView('login'), 0);
       return null;
    }
    return <SuperAdminDashboard onLogout={handleLogout} />;
  }

  if (view === 'public') {
    return (
      <PublicMenu 
        data={data} 
        onBack={() => navigateTo('landing')} 
        onInteraction={handlePublicInteraction}
      />
    );
  }

  if (view === 'login') {
    return <LoginPage onLogin={handleLogin} onNavigate={navigateTo} />;
  }

  if (view === 'register') {
    return <RegisterPage onRegister={handleRegister} onNavigate={navigateTo} />;
  }

  if (view === 'admin') {
    if (!currentUser) {
      setTimeout(() => setView('login'), 0);
      return null;
    }
    return (
      <>
        <AdminDashboard 
          data={data} 
          onUpdate={saveUserData} 
          onPreview={() => setShowQR(true)} 
          onLogout={handleLogout}
        />
        <QRModal 
          isOpen={showQR} 
          onClose={() => setShowQR(false)} 
          url={window.location.href + '#public'} 
          businessName={data.profile.name}
        />
      </>
    );
  }

  const t = LANDING_TRANSLATIONS[landingLang];

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-orange-500 to-purple-600 p-2 rounded-lg">
                <Store className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">GourmetQR</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{t.nav.features}</a>
              <a href="#demo" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{t.nav.howItWorks}</a>
              <button 
                onClick={() => setLandingLang(landingLang === 'en' ? 'el' : 'en')}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Globe size={16} /> {landingLang.toUpperCase()}
              </button>
            </div>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <button 
                  onClick={() => navigateTo('admin')}
                  className="bg-white text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigateTo('login')}
                    className="hidden md:block text-sm font-bold text-white hover:text-orange-400 transition-colors"
                  >
                    {t.nav.login}
                  </button>
                  <button 
                    onClick={() => navigateTo('register')}
                    className="bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 hover:scale-105"
                  >
                    {t.nav.startFree}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-500/20 rounded-full blur-[120px] -z-10 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] -z-10 opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Copy */}
            <div className="text-center lg:text-left space-y-8 fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-orange-400 font-medium">
                <Star size={14} className="fill-orange-400" /> {t.hero.badge}
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
                {t.hero.title.split(' ').map((word, i) => 
                  i < 3 ? <span key={i}>{word} </span> : <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">{word} </span>
                )}
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t.hero.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => navigateTo('register')}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {t.hero.ctaPrimary} <ArrowRight size={20} />
                </button>
                <button 
                  onClick={handleDemo}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 text-white border border-slate-700 rounded-full font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} className="text-purple-400" /> {t.hero.ctaSecondary}
                </button>
              </div>
              
              <p className="text-sm text-slate-500 flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle2 size={16} className="text-green-500" /> {t.hero.noCard}
              </p>
            </div>

            {/* Right Column: 3D Phone Mockup */}
            <div className="relative fade-in-up delay-200 lg:h-[700px] flex items-center justify-center">
               <div className="relative z-10 animate-float">
                  {/* Phone Case */}
                  <div className="relative w-[320px] h-[650px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl shadow-orange-500/20 overflow-hidden ring-1 ring-white/10">
                     {/* Dynamic Island */}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20"></div>
                     
                     {/* Screen Content - Simulated Menu */}
                     <div className="w-full h-full bg-white overflow-hidden flex flex-col">
                        <div className="h-48 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80')] bg-cover relative">
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                              <h3 className="text-white font-bold text-2xl">Coastal Breeze</h3>
                              <p className="text-white/80 text-xs">Seaside Lounge • ⭐ 4.9</p>
                           </div>
                        </div>
                        <div className="flex-1 p-4 bg-gray-50 space-y-3 overflow-y-hidden relative">
                           {/* Fake Items */}
                           <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=100&q=80" className="w-16 h-16 rounded-lg object-cover" alt="Pizza" />
                              <div>
                                 <h4 className="font-bold text-slate-800 text-sm">Truffle Pizza</h4>
                                 <p className="text-xs text-slate-500 mt-1 line-clamp-1">Wild mushrooms, black truffle oil...</p>
                                 <div className="flex justify-between items-center mt-2 w-32">
                                    <span className="font-bold text-orange-500 text-sm">$18.00</span>
                                 </div>
                              </div>
                           </div>
                           <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                              <img src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=100&q=80" className="w-16 h-16 rounded-lg object-cover" alt="Cake" />
                              <div>
                                 <h4 className="font-bold text-slate-800 text-sm">Lemon Tart</h4>
                                 <p className="text-xs text-slate-500 mt-1 line-clamp-1">Zesty lemon curd, meringue...</p>
                                 <div className="flex justify-between items-center mt-2 w-32">
                                    <span className="font-bold text-orange-500 text-sm">$9.50</span>
                                 </div>
                              </div>
                           </div>
                           <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 opacity-60">
                              <img src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=100&q=80" className="w-16 h-16 rounded-lg object-cover" alt="Drink" />
                              <div>
                                 <h4 className="font-bold text-slate-800 text-sm">Mojito</h4>
                                 <p className="text-xs text-slate-500 mt-1">Fresh mint, lime, rum, soda...</p>
                              </div>
                           </div>
                           
                           {/* Floating Action Button inside phone */}
                           <div className="absolute bottom-6 right-4 bg-slate-900 text-white p-3 rounded-full shadow-lg">
                              <Utensils size={20} />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               
               {/* Decorative Background Elements behind phone */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full -z-10"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/5 rounded-full -z-10"></div>
               
               {/* Floating Badges */}
               <div className="absolute top-20 right-0 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-3 animate-float delay-100">
                  <div className="bg-green-500/20 p-2 rounded-lg"><Zap className="text-green-400" size={20} /></div>
                  <div>
                     <p className="text-white font-bold text-sm">Instant Load</p>
                     <p className="text-slate-400 text-xs">No app download</p>
                  </div>
               </div>
               <div className="absolute bottom-32 left-0 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-3 animate-float delay-300">
                  <div className="bg-purple-500/20 p-2 rounded-lg"><Globe className="text-purple-400" size={20} /></div>
                  <div>
                     <p className="text-white font-bold text-sm">30+ Languages</p>
                     <p className="text-slate-400 text-xs">Auto-translation</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-800 pt-12 mt-12 fade-in-up delay-300">
            {t.stats.map((stat, i) => (
              <div key={i} className="text-center md:text-left">
                 <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
                 <p className="text-slate-500 uppercase tracking-wider text-xs font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to run a smarter venue</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Powerful tools built for restaurants, cafes, bars, and hotels.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors group">
                 <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="text-orange-500" size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-3">{t.features.ai.title}</h3>
                 <p className="text-slate-400 leading-relaxed">{t.features.ai.desc}</p>
              </div>
              <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors group">
                 <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <QrCode className="text-blue-500" size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-3">{t.features.qr.title}</h3>
                 <p className="text-slate-400 leading-relaxed">{t.features.qr.desc}</p>
              </div>
              <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors group">
                 <div className="bg-purple-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Globe className="text-purple-500" size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-3">{t.features.trans.title}</h3>
                 <p className="text-slate-400 leading-relaxed">{t.features.trans.desc}</p>
              </div>
           </div>
        </div>
      </section>

      {/* Theme Showcase */}
      <section className="py-24 bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stunning themes for every brand</h2>
                 <p className="text-slate-400 max-w-xl">Choose from our professionally designed templates that adapt to your brand colors and style.</p>
              </div>
              <button onClick={() => navigateTo('public')} className="text-orange-400 font-bold hover:text-orange-300 flex items-center gap-2">
                 View All Examples <ArrowUpRight size={18} />
              </button>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Modern', color: 'bg-gray-100', text: 'text-slate-900', accent: 'bg-orange-500' },
                { name: 'Dark Mode', color: 'bg-slate-900', text: 'text-white', accent: 'bg-blue-500' },
                { name: 'Minimal', color: 'bg-white', text: 'text-black', accent: 'bg-black' },
                { name: 'Classic', color: 'bg-[#fdfbf7]', text: 'text-stone-800', accent: 'bg-stone-800' }
              ].map((theme, i) => (
                <div key={i} className={`aspect-[9/16] rounded-2xl p-4 flex flex-col ${theme.color} border border-white/10 relative group overflow-hidden cursor-default hover:scale-[1.02] transition-transform duration-300`}>
                   <div className={`w-full h-32 rounded-lg mb-3 bg-current opacity-10 ${theme.text}`}></div>
                   <div className={`w-3/4 h-4 rounded mb-2 bg-current opacity-20 ${theme.text}`}></div>
                   <div className={`w-1/2 h-3 rounded mb-6 bg-current opacity-10 ${theme.text}`}></div>
                   <div className="space-y-3">
                      {[1,2,3].map(j => (
                        <div key={j} className="flex gap-2">
                           <div className={`w-10 h-10 rounded bg-current opacity-10 ${theme.text}`}></div>
                           <div className="flex-1">
                              <div className={`w-full h-3 rounded mb-1 bg-current opacity-20 ${theme.text}`}></div>
                              <div className={`w-1/2 h-2 rounded bg-current opacity-10 ${theme.text}`}></div>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="mt-auto text-center">
                      <span className={`text-xs font-bold uppercase tracking-wider opacity-50 ${theme.text}`}>{theme.name}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-purple-700 opacity-90"></div>
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
         
         <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your menu?</h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">Join hundreds of venues saving time and increasing sales with GourmetQR.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <button 
                  onClick={() => navigateTo('register')}
                  className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-transform active:scale-95 shadow-xl"
               >
                  Get Started for Free
               </button>
               <button 
                  onClick={handleDemo}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors"
               >
                  Try the Demo
               </button>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
               <div className="flex items-center gap-2 mb-4 md:mb-0">
                  <div className="bg-orange-500 p-1.5 rounded-lg">
                    <Store className="text-white" size={16} />
                  </div>
                  <span className="text-lg font-bold text-white">GourmetQR</span>
               </div>
               <div className="text-slate-500 text-sm">
                  &copy; {new Date().getFullYear()} GourmetQR. All rights reserved.
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;