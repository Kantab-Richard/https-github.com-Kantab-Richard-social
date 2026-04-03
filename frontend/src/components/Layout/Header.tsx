import React, { useState, useRef, useEffect } from "react";
import { Download, User as UserIcon, LogOut, ChevronDown, Menu, X, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { motion, AnimatePresence } from "motion/react";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false); // Close menu on logout
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    { label: "HD Downloader", path: "/features/hd-downloader" },
    { label: "Extract MP3", path: "/features/extract-mp3" },
    { label: "SRT Subtitles", path: "/features/srt-subtitles" },
    { label: "Smart Trim", path: "/features/smart-trim" },
    { label: "AI Transcription", path: "/features/ai-transcription" },
    { label: "Smart Repurposing", path: "/features/smart-repurposing" },
  ];

  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight truncate">
            Medicraft<span className="text-orange-500">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-6">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
            <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <Link to="/dashboard" className="hover:text-orange-500 transition-colors">Dashboard</Link>
            <Link to="/library" className="hover:text-orange-500 transition-colors">Library</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-orange-500 font-bold hover:text-orange-400 transition-colors flex items-center gap-1">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}

            {/* New Menu with Submenu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="flex items-center gap-1 hover:text-orange-500 transition-colors focus:outline-none"
              >
                Tools <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#141414] border border-white/10 rounded-lg shadow-lg py-2 z-50"
                  >
                    {menuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)} // Close menu on item click
                        className="block px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-orange-500 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 md:gap-4">
            {user ? (
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{user.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-white/40 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-xs md:text-sm font-medium text-white/60 hover:text-orange-500 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-white text-black px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold hover:bg-white/90 transition-colors shrink-0">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden text-white/60 hover:text-white focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0F0F0F] border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-6">
              <div className="flex flex-col gap-4">
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-white/60 hover:text-orange-500 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-white/60 hover:text-orange-500 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/library" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-white/60 hover:text-orange-500 transition-colors"
                >
                  Library
                </Link>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Tools</p>
                <div className="grid grid-cols-1 gap-3">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm text-white/60 hover:text-orange-500 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-orange-500 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
                      <UserIcon className="w-4 h-4" />
                      <span>{user.name}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-white/40 hover:text-red-500 transition-colors px-4 py-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link 
                      to="/login" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center py-3 text-sm font-bold text-white/60 border border-white/10 rounded-xl hover:text-white transition-colors"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center py-3 text-sm font-bold bg-white text-black rounded-xl hover:bg-white/90 transition-colors"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
