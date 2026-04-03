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
  Calendar,
  Download as DownloadIcon
} from "lucide-react";
import { useAuth } from "./src/store/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Types
interface User {
  id: string;
  name: string; // Changed from username to name to match backend
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

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  Permissions: Permission[];
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
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'roles' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, jobsRes, platformRes, rolesRes, permissionsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/jobs'),
        axios.get('/api/admin/platform-stats'),
        axios.get('/api/admin/roles'),
        axios.get('/api/admin/permissions')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setJobs(jobsRes.data);
      setPlatformStats(platformRes.data);
      setRoles(rolesRes.data);
      setAllPermissions(permissionsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'delete') => {
    try {
      await axios.post(`/api/admin/users/${userId}/${action}`);
      fetchAdminData(); // Refresh data
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

  const togglePermission = async (roleId: string, permissionName: string, currentPermissions: Permission[]) => {
    const hasPerm = currentPermissions.some(p => p.name === permissionName);
    const newPermNames = hasPerm 
      ? currentPermissions.filter(p => p.name !== permissionName).map(p => p.name)
      : [...currentPermissions.map(p => p.name), permissionName];
    
    await axios.post(`/api/admin/roles/${roleId}/permissions`, { permissions: newPermNames });
    fetchAdminData();
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/60">Manage users, monitor downloads, and configure system settings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-white/60 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
            <p className="text-white/40 text-xs mt-2">+12 this week</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#141414] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Download className="w-8 h-8 text-purple-500" />
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-white/60 text-sm">Total Downloads</p>
            <p className="text-3xl font-bold text-white">{stats?.totalDownloads?.toLocaleString() || 0}</p>
            <p className="text-white/40 text-xs mt-2">{stats?.todayDownloads || 0} today</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#141414] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <HardDrive className="w-8 h-8 text-green-500" />
              <Database className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">Storage Used</p>
            <p className="text-3xl font-bold text-white">{stats?.usedStorage || '0 GB'}</p>
            <p className="text-white/40 text-xs mt-2">of {stats?.totalStorage || '0 GB'}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#141414] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Cpu className="w-8 h-8 text-blue-500" />
              <Clock className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">Server Status</p>
            <p className="text-3xl font-bold text-white">{stats?.cpuUsage || 0}%</p>
            <p className="text-white/40 text-xs mt-2">CPU • {stats?.memoryUsage || 0}% RAM</p>
          </motion.div>
        </div>

        {/* Platform Distribution */}
        {platformStats && (
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-white font-semibold mb-4">Platform Distribution</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(platformStats).map(([platform, count]) => (
                <div key={platform} className="text-center">
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-white/40 text-sm capitalize">{platform}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'jobs', label: 'Jobs', icon: Activity },
            { id: 'roles', label: 'Roles', icon: Shield },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* System Health */}
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Server Uptime</span>
                    <span className="text-white">{stats?.serverUptime || '0 days'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Active Jobs</span>
                    <span className="text-white">{stats?.activeJobs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Failed Jobs (24h)</span>
                    <span className="text-red-500">{stats?.failedJobs || 0}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      Clear Failed Jobs
                    </button>
                    <button className="w-full text-left px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      Generate Report
                    </button>
                    <button className="w-full text-left px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      Backup Database
                    </button>
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4">Download Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Today</span>
                      <span className="text-white">{stats?.todayDownloads || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">This Week</span>
                      <span className="text-white">{stats?.weekDownloads || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">This Month</span>
                      <span className="text-white">{stats?.monthDownloads || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <button
                  onClick={() => fetchAdminData()}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">User</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Email</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Downloads</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Status</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Joined</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(user => 
                      user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      (filterStatus === 'all' || user.status === filterStatus)
                    ).map((user) => (
                      <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4 text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-orange-500" />
                            </div>
                            <span className="text-white">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/60 text-sm">{user.email}</td>
                        <td className="px-6 py-4 text-white">{user.downloadsCount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleUserAction(user.id, 'ban')}
                                className="text-yellow-500 hover:text-yellow-400"
                              >
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user.id, 'unban')}
                                className="text-green-500 hover:text-green-400"
                              >
                                Unban
                              </button>
                            )}
                            <button
                              onClick={() => handleUserAction(user.id, 'delete')}
                              className="text-red-500 hover:text-red-400"
                            >
                              Delete
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
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold">Recent Jobs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">ID</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">URL</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Platform</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Status</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Created</th>
                      <th className="text-left px-6 py-3 text-white/60 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.slice(0, 20).map((job) => (
                      <tr key={job.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4 text-white/60 text-sm font-mono">{job.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-white/60 text-sm truncate max-w-xs">{job.url}</td>
                        <td className="px-6 py-4 text-white capitalize">{job.platform || 'YouTube'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60 text-sm">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {job.status === 'failed' && (
                              <button
                                onClick={() => handleJobAction(job.id, 'retry')}
                                className="text-blue-500 hover:text-blue-400"
                              >
                                Retry
                              </button>
                            )}
                            <button
                              onClick={() => handleJobAction(job.id, 'delete')}
                              className="text-red-500 hover:text-red-400"
                            >
                              Delete
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

          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roles.map(role => (
                <div key={role.id} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg capitalize">{role.name}</h3>
                      <p className="text-white/40 text-sm">{role.description}</p>
                    </div>
                    <Shield className="w-5 h-5 text-orange-500" />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-white/60 text-xs uppercase tracking-wider font-semibold">Permissions</h4>
                    <div className="flex flex-wrap gap-2">
                      {allPermissions.map(perm => {
                        const isActive = role.Permissions?.some(p => p.id === perm.id);
                        return (
                          <button
                            key={perm.id}
                            onClick={() => togglePermission(role.id, perm.name, role.Permissions || [])}
                            className={`px-3 py-1 rounded-full text-xs transition-colors border ${
                              isActive 
                                ? 'bg-orange-500/20 border-orange-500 text-orange-500' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                            }`}
                            title={perm.description}
                          >
                            {perm.name.replace(/_/g, ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              <button className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">
                <Shield className="w-8 h-8 mb-2" />
                <span>Create New Role</span>
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Max File Size (MB)</label>
                    <input
                      type="number"
                      defaultValue={1024}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Concurrent Downloads</label>
                    <input
                      type="number"
                      defaultValue={5}
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Maintenance Mode</span>
                    <button className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg">Enable</button>
                  </div>
                </div>
              </div>

              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Rate Limiting</span>
                    <span className="text-green-500">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">2FA Required for Admins</span>
                    <button className="px-4 py-2 bg-orange-500/20 text-orange-500 rounded-lg">Enable</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">IP Whitelist</span>
                    <button className="px-4 py-2 bg-white/10 text-white rounded-lg">Configure</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};