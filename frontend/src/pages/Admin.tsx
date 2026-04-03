import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Users,
  Download,
  FileText,
  Settings,
  BarChart3,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Eye,
  Edit2,
  MoreVertical,
  RefreshCw,
  Database,
  Cpu,
  HardDrive,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Calendar
} from "lucide-react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned' | 'pending';
  createdAt: string;
  downloadsCount: number;
  lastActive: string;
}

interface Job {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  step: string;
  createdAt: string;
  completedAt?: string;
  userId: string;
  platform: string;
  fileSize?: string;
  format?: string;
}

interface SystemStats {
  totalUsers: number;
  totalDownloads: number;
  totalJobs: number;
  activeJobs: number;
  failedJobs: number;
  totalStorage: string;
  usedStorage: string;
  serverUptime: string;
  cpuUsage: number;
  memoryUsage: number;
  todayDownloads: number;
  weekDownloads: number;
  monthDownloads: number;
}

interface PlatformStats {
  youtube: number;
  tiktok: number;
  instagram: number;
  facebook: number;
  twitter: number;
}

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, jobsRes, platformRes] = await Promise.all([
        axios.get('/api/admin/stats').catch(() => ({ data: null })),
        axios.get('/api/admin/users').catch(() => ({ data: [] })),
        axios.get('/api/admin/jobs').catch(() => ({ data: [] })),
        axios.get('/api/admin/platform-stats').catch(() => ({ data: null }))
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setJobs(jobsRes.data);
      setPlatformStats(platformRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'delete') => {
    try {
      await axios.post(`/api/admin/users/${userId}/${action}`);
      fetchAdminData(); 
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const handleJobAction = async (jobId: string, action: 'retry' | 'cancel' | 'delete') => {
    try {
      await axios.post(`/api/admin/jobs/${jobId}/${action}`);
      fetchAdminData();
    } catch (error) {
      console.error(`Failed to ${action} job:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'completed': return 'text-green-500 bg-green-500/10';
      case 'failed': return 'text-red-500 bg-red-500/10';
      case 'processing': return 'text-blue-500 bg-blue-500/10';
      case 'banned': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/60">Manage users, monitor downloads, and configure system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-white/60 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Download className="w-8 h-8 text-purple-500" />
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-white/60 text-sm">Total Downloads</p>
            <p className="text-3xl font-bold text-white">{stats?.totalDownloads?.toLocaleString() || 0}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <HardDrive className="w-8 h-8 text-green-500" />
              <Database className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">Storage Used</p>
            <p className="text-3xl font-bold text-white">{stats?.usedStorage || '0 GB'}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Cpu className="w-8 h-8 text-blue-500" />
              <Clock className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">Server Load</p>
            <p className="text-3xl font-bold text-white">{stats?.cpuUsage || 0}%</p>
          </motion.div>
        </div>

        <div className="flex gap-2 border-b border-white/10 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'jobs', label: 'Jobs', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                activeTab === tab.id ? 'text-orange-500 border-b-2 border-orange-500' : 'text-white/60 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-white/40">System Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Server Uptime</span>
                    <span className="text-white font-mono">{stats?.serverUptime || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Memory Usage</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${stats?.memoryUsage || 0}%` }} />
                      </div>
                      <span className="text-white font-mono text-sm">{stats?.memoryUsage || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-white/40">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => fetchAdminData()} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm transition-colors flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh Stats
                  </button>
                  <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm transition-colors flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Downloads</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-white font-medium">{u.name}</div>
                            <div className="text-white/40 text-xs">{u.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60 text-sm">{u.downloadsCount}</td>
                        <td className="px-6 py-4 text-white/60 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleUserAction(u.id, u.status === 'active' ? 'ban' : 'unban')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                              <Shield className={`w-4 h-4 ${u.status === 'active' ? 'text-yellow-500' : 'text-green-500'}`} />
                            </button>
                            <button onClick={() => handleUserAction(u.id, 'delete')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Job ID</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {jobs.map(j => (
                      <tr key={j.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-white/60">{j.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${j.status === 'completed' ? 'bg-green-500' : j.status === 'failed' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`} />
                            <span className="text-white text-sm capitalize">{j.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/60 text-sm capitalize">{j.platform || 'Unknown'}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleJobAction(j.id, 'delete')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">General Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/40 text-xs uppercase font-bold mb-2">Maximum Concurrent Jobs</label>
                    <input type="number" defaultValue={10} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                  </div>
                  <div>
                    <label className="block text-white/40 text-xs uppercase font-bold mb-2">Cleanup Interval (Hours)</label>
                    <input type="number" defaultValue={24} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                  </div>
                  <div className="pt-4">
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Maintenance</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-orange-500" />
                      <div className="text-left">
                        <div className="text-white text-sm font-medium">Database Backup</div>
                        <div className="text-white/40 text-xs">Create a snapshot of current data</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div className="text-left">
                        <div className="text-white text-sm font-medium">Clear Job History</div>
                        <div className="text-white/40 text-xs">Permanently remove all job records</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;