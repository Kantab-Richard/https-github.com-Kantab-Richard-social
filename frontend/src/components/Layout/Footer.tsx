import React from "react";
import { Download, Heart } from "lucide-react";
import { motion } from "motion/react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 py-8 md:py-12 mt-12 md:mt-20 bg-black/20" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
            <Download className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg">Medicraft AI</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 md:gap-8 text-xs md:text-sm text-white/40" aria-label="Footer Navigation">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </nav>
        <div className="flex flex-col items-center md:items-end gap-1">
          <div className="text-[10px] md:text-sm text-white/20 text-center">
            © {new Date().getFullYear()} Medicraft AI. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-white/30">
            <span>Developed with</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </motion.span>
            <span>by <span className="text-white/50 font-semibold">Kanbrix Tech</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
