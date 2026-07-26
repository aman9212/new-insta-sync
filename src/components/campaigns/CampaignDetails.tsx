import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/Avatar';
import { formatCents, formatRatePerMillion } from '../../lib/currency';
import { useAuthContext } from '../../app/providers';
import type { CampaignWithJoins } from '../../types';

interface CampaignDetailsProps {
  campaign: CampaignWithJoins;
  onSubmitClick: () => void;
}

export function CampaignDetails({ campaign, onSubmitClick }: CampaignDetailsProps) {
  const { profile, user } = useAuthContext();
  const [brandExpanded, setBrandExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'budget' | 'stats' | 'leaders'>('guide');

  const displayName = profile?.display_name ?? user?.email ?? 'Creator';

  const isHuddle = 
    (campaign.name?.toLowerCase().includes('huddle')) || 
    (campaign.brand_name?.toLowerCase().includes('huddle'));

  // Dates formatting
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const shortYear = date.getFullYear().toString().slice(-2);
    return `${month} ${day}, ${shortYear}`;
  };

  // Guidelines and rules content
  const guidelines = isHuddle
    ? [
        'Clip the videos provided in the campaign resources',
        'Each clip should be 15 sec or longer',
        'Tag @huddle01com in your Post',
      ]
    : campaign.requirements?.slice(0, 3) || [
        'Create engaging short clips highlighting the brand features',
        'Ensure each video clip is 15 seconds or longer',
        'Tag the official brand handles in your post description',
      ];

  const rules = isHuddle
    ? [
        'Use clear, readable captions',
        'Include subtitles & audio.',
        'Must have an active creator presence on X.',
        'Avoid misinformation, exaggerated claims, or unrelated topics.',
      ]
    : campaign.requirements?.slice(3) || [
        'Use clear, readable captions and subtitles',
        'Include high-quality audio in your clips',
        'Must have active creator status on relevant platforms',
        'Avoid claims that are false or unrelated to the brand product',
      ];

  // Resources content
  const resources = isHuddle
    ? [
        { type: 'video', url: 'https://drive.google.com/drive/folders/1TpaJL3PrzwymG26kZQ19YORpWH3cDdMw?usp=sharing' },
        { type: 'website', url: 'https://x.com/huddle01com' }
      ]
    : [
        { type: 'video', url: 'https://drive.google.com/drive/folders/1TpaJL3PrzwymG26kZQ19YORpWH3cDdMw?usp=sharing' },
        { type: 'website', url: campaign.cover_url ?? '' }
      ];

  // Badge class for campaign status
  const getStatusBadgeClass = () => {
    switch (campaign.status) {
      case 'completed':
        return 'bg-[#f97316] text-white';
      case 'active':
        return 'bg-[#14b8a6] text-white';
      case 'paused':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-[#6366f1] text-white';
    }
  };

  return (
    <section className="space-y-6">
      {/* 1. Large Banner Card */}
      <div className="relative w-full h-64 sm:h-80 md:h-[420px] bg-[#0A0A0C] border border-border/80 rounded-3xl overflow-hidden shadow-lg">
        {campaign.cover_url ? (
          <img 
            src={campaign.cover_url} 
            alt={campaign.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex items-center justify-center">
            <span className="text-text-muted text-sm font-semibold tracking-wide">No cover image available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />

        {/* Status Badge - Top Right */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg tracking-widest shadow-md ${getStatusBadgeClass()}`}>
            {campaign.status}
          </span>
        </div>

        {/* Floating Navigation Pill Dock - Bottom Center */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-black/90 px-5 py-2.5 rounded-full border border-border/50 shadow-2xl flex items-center gap-6 backdrop-blur-md transition-all hover:scale-[1.02] duration-300">
          <div className="relative flex shrink-0">
            <Avatar src={profile?.avatar_url} fallback={displayName} size="sm" />
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-black" />
          </div>
          <button 
            onClick={() => setActiveTab('leaders')}
            className={`p-1 hover:scale-110 transition-transform duration-200 ${activeTab === 'leaders' ? 'text-indigo-600' : 'text-text-secondary'}`}
            title="Leaderboard"
          >
            <Icon name="trophy" size={18} />
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`p-1 hover:scale-110 transition-transform duration-200 ${activeTab === 'stats' ? 'text-indigo-600' : 'text-text-secondary'}`}
            title="Statistics"
          >
            <Icon name="menu" size={18} />
          </button>
          <button 
            onClick={() => setActiveTab('guide')}
            className={`p-1 hover:scale-110 transition-transform duration-200 ${activeTab === 'guide' ? 'text-indigo-600' : 'text-text-secondary'}`}
            title="Guide & Rules"
          >
            <Icon name="file-text" size={18} />
          </button>
        </div>
      </div>

      {/* 2. Campaign Header Information */}
      <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">{campaign.name}</h1>
          
          {/* Brand Profile & Collapsible Info */}
          <div className="mt-4">
            <div 
              onClick={() => setBrandExpanded(!brandExpanded)}
              className="inline-flex items-center gap-2 cursor-pointer hover:bg-surface-hover px-3 py-1.5 rounded-xl border border-border/60 transition-all duration-200 select-none"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500 text-xs overflow-hidden shrink-0">
                {campaign.brand_logo_url ? (
                  <img src={campaign.brand_logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="video" size={12} />
                )}
              </div>
              <span className="text-sm font-semibold text-text-primary">{campaign.brand_name ?? 'Brand'}</span>
              <Icon name="chevron-down" size={14} className={`text-text-muted transition-transform duration-200 ${brandExpanded ? 'rotate-180' : ''}`} />
            </div>

            {brandExpanded && (
              <div className="mt-3 p-4 rounded-xl border border-border bg-surface-elevated/40 text-sm text-text-secondary animate-fadeIn leading-relaxed">
                {campaign.brand_name ?? 'This brand'} is partnered with ClipStake to run high-performance video clipping campaigns. Content submitted is evaluated automatically for metrics and payouts.
              </div>
            )}
          </div>
        </div>

        {/* Type and Platform Tags Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border/40 py-4">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Type</span>
            <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
              {campaign.campaign_type.charAt(0).toUpperCase() + campaign.campaign_type.slice(1)}
            </span>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Platforms</span>
            <div className="flex gap-2">
              {campaign.platforms?.map((platform) => (
                <div key={platform} className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-surface shadow-sm" title={platform}>
                  {platform === 'youtube' ? (
                    <Icon name="youtube" size={14} className="text-red-600" />
                  ) : platform === 'instagram' ? (
                    <Icon name="instagram" size={14} className="text-pink-600" />
                  ) : platform === 'tiktok' ? (
                    <Icon name="video" size={14} className="text-text-primary" />
                  ) : (
                    <span className="text-xs uppercase font-bold">{platform[0]}</span>
                  )}
                </div>
              ))}
              {isHuddle && (
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-surface shadow-sm" title="X (Twitter)">
                  <svg className="w-3.5 h-3.5 fill-current text-text-primary" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Tags */}
        <div>
          <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Categories</span>
          <div className="flex flex-wrap gap-2">
            {isHuddle ? (
              <>
                <span className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border/80">
                  Crypto & Web3
                </span>
                <span className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border/80">
                  Technology
                </span>
              </>
            ) : (
              <>
                <span className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border/80">
                  Social Media
                </span>
                <span className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border/80">
                  Content Creation
                </span>
              </>
            )}
          </div>
        </div>

        {/* Description Body */}
        <div>
          <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">Description</span>
          <p className="whitespace-pre-wrap text-text-secondary leading-relaxed text-sm md:text-base">
            {campaign.description ?? 'No description provided.'}
          </p>
        </div>

        {/* Campaign Action Button */}
        <div>
          {campaign.status === 'completed' ? (
            <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-900/30 shadow-inner select-none cursor-not-allowed text-center">
              <Icon name="check-circle" size={16} />
              Campaign Completed
            </div>
          ) : (
            <button
              onClick={onSubmitClick}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold bg-accent text-white hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-accent/15"
            >
              <Icon name="upload" size={16} />
              Submit Post / Clip
            </button>
          )}
        </div>

        {/* Campaign Created & End Date Cards */}
        <div className="grid grid-cols-2 gap-4 mt-6 border border-border bg-surface-elevated/40 p-4 rounded-xl shadow-sm text-center">
          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Created</span>
            <span className="text-sm font-semibold text-text-primary mt-1 block">
              {formatDate(campaign.start_at || campaign.created_at)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">End Date</span>
            <span className="text-sm font-semibold text-text-primary mt-1 block">
              {formatDate(campaign.end_at)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs & Content */}
      <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
        {/* Tab Buttons bar */}
        <div className="flex border-b border-border text-sm font-medium bg-surface shrink-0">
          {(['guide', 'budget', 'stats', 'leaders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-center border-b-2 font-bold capitalize transition-all select-none hover:text-text-primary active:bg-surface-hover ${
                activeTab === tab 
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400' 
                  : 'border-transparent text-text-muted'
              }`}
            >
              {tab === 'guide' ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="file-text" size={14} /> Guide
                </span>
              ) : tab === 'budget' ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="wallet" size={14} /> Budget
                </span>
              ) : tab === 'stats' ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="trending-up" size={14} /> Stats
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="trophy" size={14} /> Leaders
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="p-6 md:p-8">
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                  <Icon name="file-text" size={16} className="text-indigo-600" />
                  Instructions
                </h3>
                <div className="rounded-2xl border border-border bg-surface-elevated/20 p-5 space-y-4">
                  <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium">
                    You have creative freedom as long as you follow the guidelines and rules below
                  </p>
                  
                  {/* Guidelines */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Guidelines</h4>
                    <ul className="list-disc pl-5 text-xs md:text-sm text-text-secondary space-y-1">
                      {guidelines.map((g, i) => (
                        <li key={i} className="leading-relaxed">{g}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Rules */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Rules</h4>
                    <ul className="list-disc pl-5 text-xs md:text-sm text-text-secondary space-y-1">
                      {rules.map((r, i) => (
                        <li key={i} className="leading-relaxed">{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                  <Icon name="link" size={16} className="text-indigo-600" />
                  Resources
                </h3>
                <div className="space-y-3">
                  {resources.map((res) => (
                    <a 
                      key={res.url}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-3 hover:bg-surface-hover hover:border-border-strong transition-all duration-200 shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border border-blue-100 dark:border-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                        <Icon name="external-link" size={14} />
                      </div>
                      <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 capitalize select-none">
                        {res.type}
                      </span>
                      <span className="text-xs font-mono text-text-secondary truncate flex-1 hover:text-indigo-600 transition-colors">
                        {res.url}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                  <Icon name="wallet" size={16} className="text-indigo-600" />
                  Budget Information
                </h3>
                
                {/* Budget cards grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface-elevated/40 p-4">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Total Budget</span>
                    <span className="text-lg font-bold text-text-primary mt-1 block">
                      {formatCents(campaign.total_budget_cents)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-elevated/40 p-4">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Remaining Budget</span>
                    <span className="text-lg font-bold text-text-primary mt-1 block">
                      {formatCents(campaign.total_budget_cents - campaign.used_budget_cents)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 p-4 rounded-xl border border-border/80 bg-surface-elevated/10">
                  <div className="flex items-center justify-between text-xs font-bold text-text-secondary mb-2 uppercase">
                    <span>Usage Progress</span>
                    <span>{Math.round((campaign.used_budget_cents / campaign.total_budget_cents) * 100)}% Used</span>
                  </div>
                  <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round((campaign.used_budget_cents / campaign.total_budget_cents) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Rates */}
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                  <Icon name="trending-up" size={16} className="text-indigo-600" />
                  Payout Rates
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-surface-elevated/20 p-4">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Rate Per Million Views</span>
                    <span className="text-sm font-bold text-text-primary mt-1 block">
                      {formatRatePerMillion(campaign.rate_per_million_cents)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-elevated/20 p-4">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Post Cap</span>
                    <span className="text-sm font-bold text-text-primary mt-1 block">
                      {campaign.cap_per_post_cents ? formatCents(campaign.cap_per_post_cents) : 'No limit'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-elevated/20 p-4">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Creator Cap</span>
                    <span className="text-sm font-bold text-text-primary mt-1 block">
                      {campaign.cap_per_creator_cents ? formatCents(campaign.cap_per_creator_cents) : 'No limit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                <Icon name="bar-chart" size={16} className="text-indigo-600" />
                Performance Metrics
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-surface-elevated/20 p-4 text-center">
                  <span className="text-[10px] text-text-muted uppercase block font-bold">Total Clips</span>
                  <span className="text-xl font-bold text-text-primary mt-1 block">4</span>
                </div>
                <div className="rounded-xl border border-border bg-surface-elevated/20 p-4 text-center">
                  <span className="text-[10px] text-text-muted uppercase block font-bold">Total Views</span>
                  <span className="text-xl font-bold text-text-primary mt-1 block">1.2M</span>
                </div>
                <div className="rounded-xl border border-border bg-surface-elevated/20 p-4 text-center">
                  <span className="text-[10px] text-text-muted uppercase block font-bold">Earnings Solved</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400 mt-1 block">$120.00</span>
                </div>
                <div className="rounded-xl border border-border bg-surface-elevated/20 p-4 text-center">
                  <span className="text-[10px] text-text-muted uppercase block font-bold">Payout Status</span>
                  <span className="text-sm font-bold text-text-primary mt-2 block bg-indigo-50 dark:bg-indigo-950/20 px-2 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 inline-block border border-indigo-150/20">
                    Escrow Loaded
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-surface-elevated/10 text-xs text-text-secondary leading-relaxed">
                Note: View metrics sync periodically every 6 hours from platforms API connection. Earnings are distributed dynamically.
              </div>
            </div>
          )}

          {activeTab === 'leaders' && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                <Icon name="trophy" size={16} className="text-indigo-600" />
                Campaign Leaderboard
              </h3>

              <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated/50 text-text-muted font-bold text-xs uppercase">
                      <th className="p-4 w-12 text-center">Rank</th>
                      <th className="p-4">Creator</th>
                      <th className="p-4 text-right">Views</th>
                      <th className="p-4 text-right">USDC Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, name: '@alex_clips', views: '2.4M', earnings: '$240.00' },
                      { rank: 2, name: '@sara_edit', views: '1.8M', earnings: '$180.00' },
                      { rank: 3, name: '@crypto_king', views: '920K', earnings: '$92.00' },
                      { rank: 4, name: '@hype_shorts', views: '450K', earnings: '$45.00' },
                    ].map((row) => (
                      <tr key={row.rank} className="border-b border-border/60 hover:bg-surface-elevated/30 transition-all">
                        <td className="p-4 text-center font-bold text-text-secondary">
                          {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                        </td>
                        <td className="p-4 flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {row.name.charAt(1).toUpperCase()}
                          </div>
                          <span className="font-semibold text-text-primary">{row.name}</span>
                        </td>
                        <td className="p-4 text-right font-medium text-text-secondary">{row.views}</td>
                        <td className="p-4 text-right font-bold text-text-primary">{row.earnings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
