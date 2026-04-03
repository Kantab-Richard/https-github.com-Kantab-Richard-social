import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { History, FileText, Download, BarChart3, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/my-jobs');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total Transcripts", value: history.length, icon: FileText, color: "text-blue-500" },
    { label: "Total Downloads", value: history.filter(j => j.status === 'completed').length, icon: Download, color: "text-green-500" },
    { label: "Usage Time", value: `${Math.round(history.length * 2.5)} min`, icon: Clock, color: "text-orange-500" },
    { label: "AI Efficiency", value: "98%", icon: TrendingUp, color: "text-purple-500" },
  ];

  if (loading) return <div className="p-20 text-center">Loading Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#141414] border border-white/10 p-6 rounded-3xl"
          >
            <div className={`w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-white/40 text-sm mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" /> Recent Activity
            </h2>
            <button onClick={() => navigate("/library")} className="text-orange-500 text-sm font-bold hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {history.slice(0, 5).map((job) => (
              <motion.div 
                key={job.id}
                onClick={() => job.status === 'completed' && navigate(`/results/${job.id}`)}
                className="bg-[#141414] border border-white/10 p-4 rounded-2xl hover:border-orange-500/50 transition-all cursor-pointer flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white/20" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{job.result?.metadata?.title || job.url}</h4>
                  <p className="text-xs text-white/40">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                  job.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                  job.status === 'failed' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                }`}>
                  {job.status}
                </span>
              </motion.div>
            ))}
            {history.length === 0 && <div className="text-center py-12 text-white/40 bg-[#141414] rounded-2xl border border-dashed border-white/10">No recent activity</div>}
          </div>
        </div>

        {/* Usage Stats Chart (Simulated) */}
        <div className="lg:col-span-1">
          <div className="bg-[#141414] border border-white/10 p-6 rounded-3xl h-full">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" /> Usage Stats
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Storage Used</span>
                  <span className="text-white font-bold">45%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[45%] h-full bg-orange-500"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">AI Credits</span>
                  <span className="text-white font-bold">820 / 1000</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[82%] h-full bg-blue-500"></div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                <p className="text-xs text-white/40 leading-relaxed">
                  Your usage is within the normal range. You have 180 AI credits remaining for this month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
