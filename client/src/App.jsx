import React, { useState, useRef, useEffect } from "react";
import { 
  Download, 
  FileText, 
  AlertCircle, 
  Settings, 
  Music,
  ExternalLink,
  Share2,
  History,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Library as LibraryIcon,
  Home as HomeIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { BrowserRouter, Routes, Route, useNavigate, Link, useLocation } from "react-router-dom";
import { Header } from "./components/Layout/Header";
import { Footer } from "./components/Layout/Footer";
import { AuthProvider, useAuth } from "./store/AuthContext";
import { Login } from "./components/Auth/Login";
import { Register } from "./components/Auth/Register";
import { Home } from "./pages/Home";
import { Results } from "./pages/Results";
import { Dashboard } from "./pages/Dashboard";
import { Library } from "./pages/Library";

function AppContent() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState("login");

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Loading...</div>;

  const navItems = [
    { label: "Home", icon: HomeIcon, path: "/" },
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Library", icon: LibraryIcon, path: "/library" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-orange-500/30 flex flex-col">
      <Header />
      
      {/* Navigation Bar */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <nav className="flex bg-[#141414] border border-white/10 p-1 rounded-2xl">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                location.pathname === item.path 
                  ? "bg-white/10 text-white" 
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-orange-500 bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20">
              <UserIcon className="w-4 h-4" /> {user.name}
            </div>
            <button 
              onClick={() => {
                logout();
                navigate("/");
              }} 
              className="text-white/40 hover:text-red-500 transition-colors p-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-400 transition-all">Get Started</Link>
          </div>
        )}
      </div>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results/:jobId" element={<Results />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Login onToggle={() => setShowAuth("register")} />} />
          <Route path="/library" element={user ? <Library /> : <Login onToggle={() => setShowAuth("register")} />} />
          <Route path="/login" element={<div className="py-20"><Login onToggle={() => navigate("/register")} /></div>} />
          <Route path="/register" element={<div className="py-20"><Register onToggle={() => navigate("/login")} /></div>} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
