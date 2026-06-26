import React, { useState } from "react";
import { Shield, Mail, Lock, Eye, EyeOff, Key, ShieldAlert } from "lucide-react";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
  errorMsg?: string;
  clearError?: () => void;
}

export default function Login({ onLogin, onNavigateToRegister, errorMsg, clearError }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearError) clearError();
    setLocalError("");
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err: any) {
      setLocalError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = () => {
    alert("SSO Login simulation activated: Authenticating with corporate credentials...");
    setEmail("professional.user@enterprise.com");
    setPassword("password123");
  };

  const handleRequestAccess = () => {
    alert("Access Request logged. If authorized, your administrator will issue credentials shortly.");
  };

  return (
    <div id="login-screen" className="flex-grow flex items-center justify-center relative px-6 py-12 md:py-24 min-h-[90vh]">
      {/* Background Decorative Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-secondary-container/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-primary-container/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-[440px] z-10">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container rounded-xl mb-4 shadow-lg shadow-primary-container/20 text-on-primary">
            <Shield className="w-8 h-8" fill="currentColor" />
          </div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-primary tracking-tight">Sentience Ledger</h1>
          <p className="font-body-sm text-sm text-on-surface-variant mt-1">Secure Notes Management System</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-container-lowest border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.05)] rounded-xl p-8">
          {/* Error alerts */}
          {(errorMsg || localError) && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg flex items-center gap-2 text-sm border border-error/20">
              <ShieldAlert className="w-4 h-4 text-error shrink-0" />
              <span>{localError || errorMsg}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1">
              <label className="font-label-md text-sm text-on-surface-variant block" htmlFor="email">
                Email Address
              </label>
              <div className="relative group flex items-center border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 rounded-lg transition-all bg-white">
                <span className="absolute left-3 text-on-surface-variant">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-11 pr-4 py-3 bg-transparent border-none outline-none focus:ring-0 font-body-md text-on-surface text-base placeholder:text-outline"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="professional.user@enterprise.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-sm text-on-surface-variant block" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Please contact your IT administrator to reset your enterprise passphrase.")}
                  className="font-label-sm text-xs text-primary hover:underline transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group flex items-center border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 rounded-lg transition-all bg-white">
                <span className="absolute left-3 text-on-surface-variant">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-11 pr-11 py-3 bg-transparent border-none outline-none focus:ring-0 font-body-md text-on-surface text-base placeholder:text-outline"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  className="absolute right-3 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Security Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container cursor-pointer"
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="font-body-sm text-xs text-on-surface-variant select-none cursor-pointer" htmlFor="remember">
                Trust this device for 30 days
              </label>
            </div>

            {/* Action Button */}
            <button
              className="w-full bg-primary hover:bg-primary-container text-white font-headline-md font-medium py-3 rounded-lg shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-outline-variant"></div>
            <span className="px-3 font-label-sm text-xs text-outline font-mono">OR</span>
            <div className="flex-grow h-px bg-outline-variant"></div>
          </div>

          {/* SSO Button */}
          <button
            onClick={handleSSO}
            className="w-full flex items-center justify-center space-x-3 border border-outline-variant py-3 rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer"
          >
            <Key className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
            <span className="font-body-md text-sm text-on-surface-variant font-medium">
              Sign in with Corporate SSO
            </span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <p className="font-body-md text-sm text-on-surface-variant">
            New to Sentience Ledger?{" "}
            <button
              onClick={onNavigateToRegister}
              className="text-primary font-bold hover:underline ml-1 cursor-pointer"
            >
              Request Access
            </button>
          </p>
        </div>
      </div>

      {/* Decorative Visual Ornament for Large Screens */}
      <div className="hidden lg:block absolute right-[10%] top-1/2 -translate-y-1/2 w-80 h-[360px]">
        <div className="w-full h-full bg-white/80 backdrop-blur-md border border-outline-variant/60 rounded-3xl p-6 flex flex-col justify-end shadow-2xl relative">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary-fixed/50 rounded-full blur-xl"></div>
          <div className="mb-6">
            <div className="w-12 h-1.5 bg-primary-container rounded-full mb-2"></div>
            <div className="w-24 h-1 bg-outline-variant rounded-full opacity-50"></div>
          </div>
          <h3 className="font-headline-md text-lg font-bold text-primary mb-2">Military-Grade Encryption</h3>
          <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            Your intellectual property is secured with AES-256 at-rest and TLS 1.3 in-transit, ensuring absolute privacy for your professional insights.
          </p>
        </div>
      </div>
    </div>
  );
}
