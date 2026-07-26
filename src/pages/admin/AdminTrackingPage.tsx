import React, { useEffect, useState } from 'react';
import { trackingService } from '../../services/tracking.service';
import type { TrackedPost, TrackingFraudAlert } from '../../types/tracking';
import { ActivityIcon, AlertTriangleIcon, CheckCircleIcon, SettingsIcon, TrendingUpIcon, EyeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminTrackingPage: React.FC = () => {
  const [posts, setPosts] = useState<TrackedPost[]>([]);
  const [alerts, setAlerts] = useState<TrackingFraudAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [postsData, alertsData] = await Promise.all([
          trackingService.getTrackedPosts(),
          trackingService.getFraudAlerts()
        ]);
        setPosts(postsData);
        setAlerts(alertsData);
      } catch (err) {
        console.error('Failed to load tracking data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading tracking engine...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <ActivityIcon className="w-8 h-8 text-blue-500" />
              <span>Tracking & Anti-Fraud Engine</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Real-time monitoring and anomaly detection for social media submissions.
            </p>
          </div>
          <Link 
            to="/admin/tracking/settings"
            className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <SettingsIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Tracking Settings</span>
          </Link>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center mb-4">
              <AlertTriangleIcon className="w-5 h-5 mr-2" /> 
              Active Fraud Alerts ({alerts.length})
            </h2>
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-800/50 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white capitalize">{alert.alert_type.replace(/_/g, ' ')}</span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                        Risk Score: {alert.risk_score}/100
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{alert.description}</p>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracked Posts Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <EyeIcon className="w-5 h-5 mr-2 text-gray-500" /> Currently Tracked Posts
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider mb-2 ${
                      post.platform === 'instagram' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                      post.platform === 'tiktok' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {post.platform}
                    </span>
                    <a href={post.post_url} target="_blank" rel="noreferrer" className="block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px] sm:max-w-xs">
                      {post.post_url}
                    </a>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">AI Risk Score</div>
                    <div className={`text-2xl font-bold ${
                      post.current_risk_score > 75 ? 'text-red-500' :
                      post.current_risk_score > 50 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {post.current_risk_score}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-gray-100 dark:border-gray-700 my-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Views</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{post.current_views.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Likes</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{post.current_likes.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Comments</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{post.current_comments.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                    <div className="font-semibold flex items-center text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="w-3 h-3 mr-1" /> Active
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Last check: {new Date(post.last_tracked_at || post.created_at).toLocaleString()}</span>
                  <button className="flex items-center text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors font-medium">
                    <TrendingUpIcon className="w-4 h-4 mr-1" /> View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
