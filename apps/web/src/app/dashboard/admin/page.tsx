'use client';
import { useState } from 'react';
import { Shield, Users, BarChart3, Settings, Activity, AlertTriangle, TrendingUp, Eye } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'system', label: 'System', icon: Settings },
];

const mockStats = {
  totalUsers: 1250,
  activeToday: 342,
  totalQuestions: 4500,
  mocksTaken: 8900,
  avgAccuracy: 67.5,
  revenue: 124500,
};

const mockUsers = [
  { id: '1', name: 'Amit Sharma', email: 'amit@email.com', status: 'active', joined: '2024-01-15', xp: 4500 },
  { id: '2', name: 'Priya Patel', email: 'priya@email.com', status: 'active', joined: '2024-02-20', xp: 3200 },
  { id: '3', name: 'Rahul Gupta', email: 'rahul@email.com', status: 'inactive', joined: '2024-03-10', xp: 1800 },
];

const mockLogs = [
  { time: '12:45:32', level: 'info', message: 'User amit logged in', ip: '192.168.1.1' },
  { time: '12:44:18', level: 'warn', message: 'Rate limit exceeded for /api/practice', ip: '10.0.0.5' },
  { time: '12:43:55', level: 'error', message: 'MongoDB connection timeout', ip: 'localhost' },
  { time: '12:42:30', level: 'info', message: 'New user registered: priya@email.com', ip: '192.168.1.50' },
];

const recentActivity = [
  { action: 'Mock test completed', user: 'Amit Sharma', time: '2 min ago', score: 85 },
  { action: 'Battle won', user: 'Priya Patel', time: '5 min ago', score: 78 },
  { action: 'Streak milestone', user: 'Rahul Gupta', time: '8 min ago', score: 15 },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="border-b bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage users, analytics, and system settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% from last month
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.activeToday}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">27% of total users</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mocks Taken</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.mocksTaken.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Across all users</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.avgAccuracy}%</p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +3.2% improvement
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.user[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left">
                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">View All Users</p>
                    <p className="text-xs text-gray-500">Manage user accounts</p>
                  </button>
                  <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left">
                    <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Analytics</p>
                    <p className="text-xs text-gray-500">View detailed reports</p>
                  </button>
                  <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Settings</p>
                    <p className="text-xs text-gray-500">Configure system</p>
                  </button>
                  <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left">
                    <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Logs</p>
                    <p className="text-xs text-gray-500">View system logs</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 w-64"
                />
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Add User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">XP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.joined}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.xp.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${mockStats.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Questions Bank</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.totalQuestions.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Avg Session Time</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">42 mins</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Usage Analytics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Practice Mode</span>
                    <span className="font-medium text-gray-900 dark:text-white">45%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-purple-600 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Mock Tests</span>
                    <span className="font-medium text-gray-900 dark:text-white">30%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Battle Mode</span>
                    <span className="font-medium text-gray-900 dark:text-white">15%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-green-600 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Pomodoro Sessions</span>
                    <span className="font-medium text-gray-900 dark:text-white">10%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-orange-600 rounded-full" style={{ width: '10%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Logs</h3>
              <div className="space-y-2 font-mono text-sm">
                {mockLogs.map((log, i) => (
                  <div key={i} className={`p-3 rounded-lg ${
                    log.level === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                    log.level === 'warn' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                    'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    <span className="text-gray-400">[{log.time}]</span> [{log.level.toUpperCase()}] {log.message} <span className="text-gray-400">- {log.ip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Server Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">API Server</span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-green-600 dark:text-green-400">Running</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">MongoDB</span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">WebSocket</span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Environment</span>
                    <span className="text-gray-900 dark:text-white font-medium">development</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Port</span>
                    <span className="text-gray-900 dark:text-white font-medium">3001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rate Limit</span>
                    <span className="text-gray-900 dark:text-white font-medium">100 req/15min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">JWT Expiry</span>
                    <span className="text-gray-900 dark:text-white font-medium">15 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
