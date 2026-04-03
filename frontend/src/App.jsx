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
import { BrowserRouter, Routes, Route, useNavigate, Link, useLocation, Navigate } from "react-router-dom";
import { Header } from "./components/Layout/Header";
import { Footer } from "./components/Layout/Footer";
import { AuthProvider, useAuth } from "./store/AuthContext";
import { Login } from "./components/Auth/Login";
import { Register } from "./components/Auth/Register";
import { Home } from "./pages/Home";
import { Results } from "./pages/Results";
import { Dashboard } from "./pages/Dashboard";
import { Library } from "./pages/Library";
import { Admin } from "./pages/Admin";

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

      {/* 
          ADSENSE PERFORMANCE: Top Leaderboard 
          Providing a min-height (e.g., 90px for standard leaderboard) prevents 
          Cumulative Layout Shift (CLS) when the ad script finishes loading.
      */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-4 min-h-[90px] flex justify-center items-center">
        <div className="bg-white/5 border border-white/5 rounded-lg w-full max-w-[728px] h-[90px] flex items-center justify-center text-white/20 text-xs">
          {/* 
             Place your AdSense code here:
             <ins className="adsbygoogle"
                  style={{ display: 'block' }}
                  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                  data-ad-slot="XXXXXXXXXX"
                  data-ad-format="horizontal" />
          */}
          Advertisement
        </div>
      </div>

      {/* Use semantic <main> to help AdSense crawlers identify primary content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results/:jobId" element={<Results />} />
          <Route
            path="/dashboard"
            element={
              !user ? (
                <Login onToggle={() => setShowAuth("register")} />
              ) : user.role === "admin" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Dashboard />
              )
            }
          />
          <Route
            path="/library"
            element={
              user ? (
                <Library />
              ) : (
                <Login onToggle={() => setShowAuth("register")} />
              )
            }
          />
          <Route
            path="/admin"
            element={
              user?.role === "admin" ? (
                <Admin />
              ) : user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
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
