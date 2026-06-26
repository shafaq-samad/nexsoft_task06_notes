import React, { useState } from "react";
import { Shield, User as UserIcon, Mail, Lock, ArrowRight, ShieldCheck, ShieldAlert } from "lucide-react";

interface RegisterProps {
  onRegister: (username: string, email: string, password: string) => Promise<void>;
  onNavigateToLogin: () => void;
  errorMsg?: string;
  clearError?: () => void;
}

export default function Register({ onRegister, onNavigateToLogin, errorMsg, clearError }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearError) clearError();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (!agree) {
      setLocalError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      await onRegister(username, email, password);
    } catch (err: any) {
      setLocalError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-screen" className="w-full max-w-[480px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 p-4">
      <div className="bg-white border border-outline-variant shadow-lg rounded-xl overflow-hidden">
        {/* Branding Header */}
        <div className="p-8 text-center border-b border-outline-variant bg-surface-container-low">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-container rounded-lg mb-4 text-on-primary">
            <Shield className="w-6 h-6" fill="currentColor" />
          </div>
          <h1 className="font-headline-lg text-2xl font-bold text-primary mb-1">Create Account</h1>
          <p className="font-body-sm text-sm text-on-surface-variant">Secure your thoughts with enterprise-grade encryption.</p>
        </div>

        {/* Form Content */}
        <form className="p-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error alerts */}
          {(errorMsg || localError) && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg flex items-center gap-2 text-sm border border-error/20">
              <ShieldAlert className="w-4 h-4 text-error shrink-0" />
              <span>{localError || errorMsg}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-1">
            <label className="font-label-md text-sm text-on-surface-variant block" htmlFor="username">
              Username
            </label>
            <div className="relative flex items-center border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 rounded-lg transition-all bg-white">
              <span className="absolute left-3 text-outline">
                <UserIcon className="w-5 h-5" />
              </span>
              <input
                className="w-full pl-11 pr-4 py-3 bg-transparent border-none outline-none focus:ring-0 font-body-md text-sm text-on-surface placeholder:text-outline-variant"
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jdoe_secure"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="font-label-md text-sm text-on-surface-variant block" htmlFor="email">
              Work Email
            </label>
            <div className="relative flex items-center border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 rounded-lg transition-all bg-white">
              <span className="absolute left-3 text-outline">
                <Mail className="w-5 h-5" />
              </span>
              <input
                className="w-full pl-11 pr-4 py-3 bg-transparent border-none outline-none focus:ring-0 font-body-md text-sm text-on-surface placeholder:text-outline-variant"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          {/* Password Field Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-label-md text-sm text-on-surface-variant block" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 rounded-lg transition-all bg-white">
                <span className="absolute left-3 text-outline">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-11 pr-4 py-3 bg-transparent border-none outline-none focus:ring-0 font-body-md text-sm text-on-surface placeholder:text-outline-variant"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-sm text-on-surface-variant block" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative flex items-center border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 rounded-lg transition-all bg-white">
                <span className="absolute left-3 text-outline">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-11 pr-4 py-3 bg-transparent border-none outline-none focus:ring-0 font-body-md text-sm text-on-surface placeholder:text-outline-variant"
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          {/* Terms/Agreement */}
          <div className="flex items-start gap-2 pt-1">
            <input
              className="mt-1 w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary cursor-pointer shrink-0"
              id="terms"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              required
            />
            <label className="font-body-sm text-xs text-on-surface-variant leading-tight select-none cursor-pointer" htmlFor="terms">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => alert("Terms of Service: By signing up, you agree to maintain credential confidentiality and respect note privacy rules.")}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => alert("Privacy Policy: Your notes are encrypted and fully private to your account. We never share or expose your personal content.")}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Privacy Policy
              </button>
              .
            </label>
          </div>

          {/* Action Button */}
          <button
            className="w-full bg-primary text-white font-label-md font-medium py-3 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Login Redirect */}
          <div className="text-center pt-2">
            <p className="font-body-sm text-sm text-on-surface-variant">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-primary font-bold hover:underline ml-1 cursor-pointer"
              >
                Log In
              </button>
            </p>
          </div>
        </form>

        {/* Trust Badges */}
        <div className="bg-surface-container-low p-4 flex justify-center items-center gap-8 border-t border-outline-variant text-xs text-on-surface-variant/70 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-label-sm uppercase tracking-wider">AES-256</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-label-sm uppercase tracking-wider">2FA READY</span>
          </div>
        </div>
      </div>

      {/* Footer Help */}
      <footer className="mt-8 text-center text-xs text-on-surface-variant/60">
        <p>© 2026 SecureNotes Enterprise. All systems operational.</p>
      </footer>
    </div>
  );
}
