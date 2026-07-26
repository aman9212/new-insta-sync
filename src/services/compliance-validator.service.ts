export interface ComplianceCheckResult {
  isCompliant: boolean;
  complianceScore: number; // 0-100
  matchedHashtags: string[];
  missingHashtags: string[];
  matchedMentions: string[];
  missingMentions: string[];
  matchedLinks: string[];
  missingLinks: string[];
  feedbackMessages: string[];
  evaluatedAt: string;
}

export interface CampaignRequirements {
  requiredHashtags?: string[];
  requiredMentions?: string[];
  requiredLinks?: string[];
}

export class ComplianceValidatorService {
  /**
   * Evaluates post caption text against campaign compliance requirements.
   * Performs case-insensitive matching ignoring extraneous spaces/newlines.
   */
  public evaluateCaption(captionText: string, requirements: CampaignRequirements): ComplianceCheckResult {
    const rawCaption = captionText || '';
    const normalizedCaption = rawCaption.toLowerCase();

    const requiredHashtags = requirements.requiredHashtags ?? [];
    const requiredMentions = requirements.requiredMentions ?? [];
    const requiredLinks = requirements.requiredLinks ?? [];

    const matchedHashtags: string[] = [];
    const missingHashtags: string[] = [];

    const matchedMentions: string[] = [];
    const missingMentions: string[] = [];

    const matchedLinks: string[] = [];
    const missingLinks: string[] = [];

    const feedbackMessages: string[] = [];

    // Check Hashtags
    for (const tag of requiredHashtags) {
      const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
      const regex = new RegExp(`#${cleanTag}\\b`, 'i');
      if (regex.test(rawCaption) || normalizedCaption.includes(`#${cleanTag.toLowerCase()}`)) {
        matchedHashtags.push(tag);
      } else {
        missingHashtags.push(tag);
        feedbackMessages.push(`Missing required campaign hashtag: ${tag.startsWith('#') ? tag : '#' + tag}`);
      }
    }

    // Check Mentions
    for (const mention of requiredMentions) {
      const cleanMention = mention.startsWith('@') ? mention.slice(1) : mention;
      const regex = new RegExp(`@${cleanMention}\\b`, 'i');
      if (regex.test(rawCaption) || normalizedCaption.includes(`@${cleanMention.toLowerCase()}`)) {
        matchedMentions.push(mention);
      } else {
        missingMentions.push(mention);
        feedbackMessages.push(`Missing required brand mention: ${mention.startsWith('@') ? mention : '@' + mention}`);
      }
    }

    // Check Links
    for (const link of requiredLinks) {
      const cleanLink = link.toLowerCase().trim();
      if (normalizedCaption.includes(cleanLink)) {
        matchedLinks.push(link);
      } else {
        missingLinks.push(link);
        feedbackMessages.push(`Missing required link/URL: ${link}`);
      }
    }

    const totalRules = requiredHashtags.length + requiredMentions.length + requiredLinks.length;
    const totalMatched = matchedHashtags.length + matchedMentions.length + matchedLinks.length;

    const isCompliant = totalRules === 0 || missingHashtags.length + missingMentions.length + missingLinks.length === 0;
    const complianceScore = totalRules === 0 ? 100 : Math.round((totalMatched / totalRules) * 100);

    return {
      isCompliant,
      complianceScore,
      matchedHashtags,
      missingHashtags,
      matchedMentions,
      missingMentions,
      matchedLinks,
      missingLinks,
      feedbackMessages,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const complianceValidatorService = new ComplianceValidatorService();
