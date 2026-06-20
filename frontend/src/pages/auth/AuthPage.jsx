import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle,
  ChefHat,
  Coffee,
  CreditCard,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MonitorSmartphone,
  Shield,
  User,
  Users,
  Zap,
} from "lucide-react";

const roleOptions = [
  {
    value: "employee",
    label: "Employee / Cashier",
    desc: "POS terminal, table orders, customers, billing, and receipts.",
    icon: MonitorSmartphone,
  },
  {
    value: "kitchen",
    label: "Kitchen Staff",
    desc: "Kitchen display system, food preparation, and order completion.",
    icon: ChefHat,
  },
];

const AuthPage = ({ mode = "login" }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [authMode, setAuthMode] = useState(mode);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupRole, setSignupRole] = useState("employee");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthMode(mode);
    setError("");
    setSuccess("");
    setLoading(false);
  }, [mode]);

  const switchMode = (nextMode) => {
    setAuthMode(nextMode);
    setError("");
    setSuccess("");

    if (nextMode === "login") {
      navigate("/login");
    } else {
      navigate("/signup");
    }
  };

  const redirectByRole = (role) => {
    if (role === "admin") {
      navigate("/admin");
      return;
    }

    if (role === "kitchen") {
      navigate("/kitchen");
      return;
    }

    navigate("/pos");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await login(loginEmail.trim(), loginPassword);

      if (result?.success) {
        redirectByRole(result?.user?.role);
      } else {
        setError(result?.error || "Invalid email or password.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (
      !signupName.trim() ||
      !signupEmail.trim() ||
      !signupPassword.trim() ||
      !signupConfirmPassword.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      name: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      role: signupRole,
    };

    try {
      let response;

      try {
        response = await API.post("/auth/register", payload);
      } catch (registerError) {
        if (registerError?.response?.status === 404) {
          response = await API.post("/auth/signup", payload);
        } else {
          throw registerError;
        }
      }

      if (response?.data?.success) {
        setSuccess("Account created successfully. Please sign in now.");

        setLoginEmail(signupEmail.trim());
        setLoginPassword("");

        setSignupName("");
        setSignupEmail("");
        setSignupPassword("");
        setSignupConfirmPassword("");
        setSignupRole("employee");

        setTimeout(() => {
          switchMode("login");
        }, 800);
      } else {
        setError(response?.data?.message || "Registration failed. Try again.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      icon: Zap,
      title: "Real-time Kitchen Display",
      desc: "Live order status sync between cashier and kitchen.",
    },
    {
      icon: BarChart3,
      title: "Business Analytics",
      desc: "Track sales, products, payments, and performance.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      desc: "Separate access for admin, employee, and kitchen users.",
    },
    {
      icon: Users,
      title: "Customer Management",
      desc: "Maintain customer profiles, loyalty, and order history.",
    },
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-[#05070d] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT PANEL */}
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#070a12] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-orange-500/20 blur-[130px]" />
            <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-violet-600/10 blur-[130px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />
          </div>

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
                <Coffee className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-black">
                  CafeFlow <span className="text-orange-500">POS</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-400">
                  Restaurant System
                </p>
              </div>
            </Link>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-5 inline-flex rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-orange-300">
              MERN Cafe Management Platform
            </p>

            <h2 className="text-5xl font-black leading-tight tracking-tight">
              Secure access for your{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                POS workspace
              </span>
            </h2>

            <p className="mt-5 max-w-md text-base leading-8 text-slate-400">
              Manage cashier orders, kitchen workflow, floor tables, payments,
              customers, reports, and admin operations from one professional
              system.
            </p>

            <div className="mt-9 grid grid-cols-1 gap-4">
              {featureCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-6 text-slate-400">
            <span className="font-black text-orange-400">Security Note:</span>{" "}
            Public signup can create employee or kitchen accounts only. Admin
            accounts should be created from the database seed script or admin
            panel.
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="relative flex min-h-screen items-center justify-center overflow-y-auto overflow-x-hidden px-5 py-10 sm:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-140px] top-[-120px] h-96 w-96 rounded-full bg-orange-500/10 blur-[130px]" />
            <div className="absolute left-[-160px] bottom-[-160px] h-96 w-96 rounded-full bg-violet-600/10 blur-[130px]" />
          </div>

          <div className="relative z-10 w-full max-w-xl">
            {/* MOBILE BRAND */}
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
                <Coffee className="h-6 w-6 text-white" />
              </div>

              <div>
                <Link to="/" className="text-xl font-black">
                  CafeFlow <span className="text-orange-500">POS</span>
                </Link>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">
                  Restaurant System
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              <div className="mb-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <h2 className="text-3xl font-black tracking-tight">
                  {authMode === "login" ? "Welcome back" : "Create account"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {authMode === "login"
                    ? "Sign in with your registered CafeFlow account."
                    : "Create a new account and choose your workspace role."}
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {authMode === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Email address
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#0b101a] py-4 pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Enter your email"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#0b101a] py-4 pl-12 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Sign In to Workspace"
                    )}
                  </button>

                  <div className="text-center text-sm">
                    <span className="text-slate-500">New here? </span>
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="font-black text-orange-400 hover:text-orange-300"
                    >
                      Create account
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Full name
                    </label>

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#0b101a] py-4 pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Enter full name"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Email address
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#0b101a] py-4 pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Enter email address"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#0b101a] py-4 pl-12 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Create password"
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowSignupPassword((prev) => !prev)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Confirm password
                    </label>

                    <div className="relative">
                      <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                      <input
                        type={showSignupConfirmPassword ? "text" : "password"}
                        value={signupConfirmPassword}
                        onChange={(e) =>
                          setSignupConfirmPassword(e.target.value)
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#0b101a] py-4 pl-12 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Confirm password"
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowSignupConfirmPassword((prev) => !prev)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                      >
                        {showSignupConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Select role
                    </label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {roleOptions.map((role) => {
                        const Icon = role.icon;
                        const selected = signupRole === role.value;

                        return (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setSignupRole(role.value)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-orange-500/50 bg-orange-500/10 text-white"
                                : "border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                                    selected
                                      ? "border-orange-500/30 bg-orange-500/15 text-orange-300"
                                      : "border-white/10 bg-white/5 text-slate-500"
                                  }`}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>

                                <p className="text-sm font-black">
                                  {role.label}
                                </p>
                              </div>

                              {selected && (
                                <Check className="h-5 w-5 text-orange-400" />
                              )}
                            </div>

                            <p className="mt-3 text-xs leading-5 text-slate-500">
                              {role.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Admin accounts are created only by an existing admin or
                      seed script for security.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : signupRole === "kitchen" ? (
                      "Create Kitchen Account"
                    ) : (
                      "Create Employee Account"
                    )}
                  </button>

                  <div className="text-center text-sm">
                    <span className="text-slate-500">
                      Already have an account?{" "}
                    </span>
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="font-black text-orange-400 hover:text-orange-300"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Payments
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <ChefHat className="h-3.5 w-3.5" />
                Kitchen
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Reports
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;