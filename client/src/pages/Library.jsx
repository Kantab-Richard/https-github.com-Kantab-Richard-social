import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { Search, FileText, Download, Trash2, ExternalLink, Filter, Grid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Library = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const filtered = history.filter(job => 
      (job.result?.metadata?.title || job.url).toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHistory(filtered);
  }, [searchQuery, history]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/my-jobs');
      setHistory(response.data);
      setFilteredHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        // In a real app, we'd have a delete endpoint
        // await axios.delete(`/api/jobs/${id}`);
        setHistory(history.filter(j => j.id !== id));
      } catch (err) {
        console.error("Failed to delete job", err);
      }
    }
  };

  if (loading) return <div className="p-20 text-center">Loading Library...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h1 className="text-3xl font-bold">Your Library</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search transcripts..." 
              className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-[#141414] border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredHistory.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-40 bg-[#141414] rounded-[40px] border border-dashed border-white/10"
          >
            <FileText className="w-16 h-16 text-white/10 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className="text-white/40">Try searching for something else or process a new video.</p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredHistory.map((job) => (
              <motion.div 
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#141414] border border-white/10 p-6 rounded-3xl hover:border-orange-500/50 transition-all group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                    job.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                    job.status === 'failed' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                  }`}>
                    {job.status}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(job.id)} className="text-white/40 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 mb-6">
                  <h3 className="font-bold mb-2 line-clamp-2">{job.result?.metadata?.title || job.url}</h3>
                  <p className="text-xs text-white/40">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => job.status === 'completed' && navigate(`/results/${job.id}`)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" /> View
                  </button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div layout className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
                  <th className="px-6 py-4 font-bold">Title</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((job) => (
                  <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-white/20" />
                        <span className="font-medium text-sm truncate max-w-xs">{job.result?.metadata?.title || job.url}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        job.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                        job.status === 'failed' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => job.status === 'completed' && navigate(`/results/${job.id}`)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(job.id)} className="text-white/40 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
