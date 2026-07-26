import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CampaignDetails } from '../../components/campaigns/CampaignDetails';
import { SubmissionForm } from '../../components/submissions/SubmissionForm';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Logo } from '../../components/layout/Logo';
import { Icon } from '../../components/ui/Icon';
import { getCampaign } from '../../services/campaign.service';
import type { CampaignWithJoins } from '../../types';

function Footer() {
  return (
    <footer className="mt-16 border-t border-border/50 bg-[#020202] text-white rounded-t-3xl p-8 md:p-12 text-sm">
      <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-4">
        {/* Branding Column */}
        <div className="md:col-span-2 space-y-4">
          <Logo size="md" />
          <p className="text-gray-400 max-w-sm mt-3 text-xs md:text-sm leading-relaxed">
            The pay-per-view marketplace connecting brands with content creators.
          </p>
        </div>

        {/* Product Column */}
        <div>
          <h4 className="font-bold text-white mb-3 tracking-wide">Product</h4>
          <ul className="space-y-2 text-xs md:text-sm text-gray-400">
            <li>
              <a href="/creator/explore" className="hover:text-accent transition-colors">Marketplace</a>
            </li>
            <li>
              <a href="#" className="hover:text-accent transition-colors">FAQ</a>
            </li>
            <li>
              <a href="/creator/dashboard" className="hover:text-accent transition-colors">Go to Dashboard</a>
            </li>
          </ul>
        </div>

        {/* Community Column */}
        <div>
          <h4 className="font-bold text-white mb-3 tracking-wide">Community</h4>
          <ul className="space-y-2 text-xs md:text-sm text-gray-400">
            <li>
              <a href="#" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Icon name="message-square" size={14} className="text-gray-500" />
                Discord
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-2 hover:text-accent transition-colors">
                <svg className="w-3.5 h-3.5 fill-current text-gray-500 hover:text-accent" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X (Twitter)
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Icon name="phone" size={14} className="text-gray-500" />
                Book a Call
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <span>© 2026 CreatorX</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}

export function CampaignPage() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<CampaignWithJoins | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    getCampaign(campaignId).then(setCampaign).catch((reason: Error) => setError(reason.message));
  }, [campaignId]);

  if (error) return <EmptyState title="Campaign unavailable" description={error} />;
  if (!campaign) return <div className="text-text-secondary">Loading campaign...</div>;

  return (
    <div className="max-w-4xl mx-auto w-full pb-10 space-y-6">
      <CampaignDetails campaign={campaign} onSubmitClick={() => setIsSubmitOpen(true)} />
      
      <Modal
        open={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Submit a post"
        description="Provide the public link to your content for verification."
        size="md"
      >
        <SubmissionForm 
          campaignId={campaign.id} 
          platforms={campaign.platforms ?? []} 
          onSubmitted={() => setIsSubmitOpen(false)} 
        />
      </Modal>

      <Footer />
    </div>
  );
}
