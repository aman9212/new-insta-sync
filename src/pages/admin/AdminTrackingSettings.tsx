import React, { useEffect, useState } from 'react';
import { trackingService } from '../../services/tracking.service';
import type { TrackingSettings } from '../../types/tracking';
import { SaveIcon, ArrowLeftIcon, SettingsIcon, ActivityIcon, ShieldAlertIcon, DatabaseIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminTrackingSettings: React.FC = () => {
  const [settings, setSettings] = useState<TrackingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await trackingService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load tracking settings', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field: keyof TrackingSettings, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      await trackingService.updateSettings(settings);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between">
          <div>
            <Link to="/admin/tracking" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <SettingsIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <span>Tracking Configuration</span>
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-colors disabled:opacity-50"
          >
            <SaveIcon className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/30">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tracking Frequency & Quotas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold mb-6 flex items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <ActivityIcon className="w-5 h-5 mr-2 text-blue-500" /> API & Frequency
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tracking Interval (Minutes)
                </label>
                <select 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={settings.tracking_interval_minutes}
                  onChange={(e) => handleChange('tracking_interval_minutes', parseInt(e.target.value))}
                >
                  <option value={15}>Every 15 Minutes</option>
                  <option value={30}>Every 30 Minutes</option>
                  <option value={60}>Every 1 Hour</option>
                  <option value={120}>Every 2 Hours</option>
                  <option value={1440}>Every 24 Hours</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">How often the engine fetches new data.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instagram API Quota (Calls/Day)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={settings.instagram_api_quota}
                  onChange={(e) => handleChange('instagram_api_quota', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  YouTube API Quota (Calls/Day)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={settings.youtube_api_quota}
                  onChange={(e) => handleChange('youtube_api_quota', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  TikTok API Quota (Calls/Day)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={settings.tiktok_api_quota}
                  onChange={(e) => handleChange('tiktok_api_quota', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* AI Risk Thresholds */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold mb-6 flex items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <ShieldAlertIcon className="w-5 h-5 mr-2 text-red-500" /> AI Risk Scoring (0-100)
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medium Risk Threshold
                </label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  className="w-full accent-yellow-500"
                  value={settings.medium_risk_threshold}
                  onChange={(e) => handleChange('medium_risk_threshold', parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Current: {settings.medium_risk_threshold}</span>
                  <span>(Flags post with yellow warning)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  High Risk Threshold
                </label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  className="w-full accent-red-500"
                  value={settings.high_risk_threshold}
                  onChange={(e) => handleChange('high_risk_threshold', parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Current: {settings.high_risk_threshold}</span>
                  <span>(Flags post with red alert)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Auto-Review Threshold
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={settings.auto_review_threshold}
                  onChange={(e) => handleChange('auto_review_threshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Automatically send to Fraud Review if score exceeds this.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Auto-Freeze Rewards Threshold
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={settings.auto_freeze_rewards_threshold}
                  onChange={(e) => handleChange('auto_freeze_rewards_threshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Automatically freeze campaign payouts if score exceeds this.</p>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2">
            <h2 className="text-lg font-bold mb-6 flex items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <DatabaseIcon className="w-5 h-5 mr-2 text-purple-500" /> Data Retention & Retries
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  History Retention (Days)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={settings.data_retention_days}
                  onChange={(e) => handleChange('data_retention_days', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">How long to keep hourly metric snapshots.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max API Retries
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={settings.max_retries}
                  onChange={(e) => handleChange('max_retries', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Number of retries when an external API fails.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
