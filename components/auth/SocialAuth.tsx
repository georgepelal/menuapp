import React from 'react';

interface SocialAuthProps {
  mode: 'login' | 'register';
  onSocialAuth: (provider: 'google' | 'apple') => void;
  isLoading?: boolean;
}

const SocialAuth: React.FC<SocialAuthProps> = ({ mode, onSocialAuth, isLoading }) => {
  return (
    <div className="mt-6">
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-slate-500 font-medium">
            Or {mode === 'login' ? 'sign in' : 'continue'} with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onSocialAuth('google')}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-sm font-semibold text-slate-700">Google</span>
        </button>

        <button
          type="button"
          disabled
          title="Apple Sign-In is coming soon"
          className="flex items-center justify-center gap-2 bg-slate-900/50 text-white/60 border border-slate-900/50 py-2.5 rounded-xl cursor-not-allowed shadow-sm"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.9-1.02 1.29.05 2.54.55 3.35 1.53-2.9 1.83-2.43 5.75.83 7.23-.55 1.54-1.4 3.09-3.16 4.49zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.17 2.37-2.22 4.23-3.74 4.25z" />
          </svg>
          <span className="text-sm font-semibold">Apple</span>
        </button>
      </div>
    </div>
  );
};

export default SocialAuth;