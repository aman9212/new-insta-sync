import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

/**
 * Normalized Icon Name Types and Aliases
 */
export type IconName =
  | string
  | 'video'
  | 'camera'
  | 'image'
  | 'arrow-right'
  | 'play'
  | 'twitter'
  | 'youtube'
  | 'instagram'
  | 'settings'
  | 'dashboard'
  | 'wallet'
  | 'analytics'
  | 'user'
  | 'bell'
  | 'menu'
  | 'search'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'upload'
  | 'download'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'edit'
  | 'folder'
  | 'file'
  | 'calendar'
  | 'clock'
  | 'lock'
  | 'shield'
  | 'check-circle'
  | 'x-circle'
  | 'alert-triangle'
  | 'info'
  | 'home'
  | 'mail'
  | 'message-square'
  | 'monitor'
  | 'moon'
  | 'sun'
  | 'laptop';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number | string;
  color?: string;
  className?: string;
  strokeWidth?: number;
  animation?: 'spin' | 'bounce' | 'pulse';
}

/**
 * Known Fallbacks / Aliases dictionary for icons that may vary by library version
 */
const ICON_ALIASES: Record<string, string> = {
  // Aliases for missing or version-variant icons
  'instagram': 'Camera',
  'twitter': 'Twitter',
  'youtube': 'Youtube',
  'tiktok': 'Video',
  'sparkles': 'Star',
  'wand': 'Wand2',
  'wand2': 'Wand2',
  'barchart3': 'BarChart3',
  'barchart2': 'BarChart2',
  'barchart': 'BarChart',
  'edit2': 'Edit',
  'edit3': 'Edit',
  'shieldcheck': 'ShieldCheck',
  'shieldalert': 'ShieldAlert',
  'checkcircle2': 'CheckCircle',
  'xcircle': 'XCircle',
  'alerttriangle': 'AlertTriangle',
  'alertcircle': 'AlertCircle',
  'pluscircle': 'PlusCircle',
  'briefcasebusiness': 'Briefcase',
  'filestack': 'FileText',
  'userround': 'User',
  'panelleftclose': 'ChevronLeft',
  'panelleftopen': 'ChevronRight',
  'arrowrightleft': 'RefreshCw',
  'alertoctagon': 'AlertTriangle',
};

/**
 * Convert kebab-case or snake_case string to PascalCase
 * e.g. "arrow-right" -> "ArrowRight", "check_circle" -> "CheckCircle"
 */
function toPascalCase(str: string): string {
  if (!str) return 'HelpCircle';
  // Check if string is already PascalCase
  const normalizedKey = str.toLowerCase().replace(/[-_]/g, '');
  if (ICON_ALIASES[normalizedKey]) {
    return ICON_ALIASES[normalizedKey];
  }

  return str
    .replace(/[-_]([a-z0-9])/g, (_, g) => g.toUpperCase())
    .replace(/^[a-z]/, (g) => g.toUpperCase());
}

/**
 * Enterprise Icon Component
 * Centralizes all icon imports and provides safe fallback rendering to prevent runtime crashes.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color,
  className = '',
  strokeWidth = 2,
  animation,
  ...props
}) => {
  const pascalName = toPascalCase(name);
  
  // Safely retrieve the icon component from Lucide exports
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[pascalName] ||
    (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ||
    LucideIcons.HelpCircle ||
    LucideIcons.AlertCircle;

  // Build animation class names
  const animationClass = animation === 'spin'
    ? 'animate-spin'
    : animation === 'pulse'
    ? 'animate-pulse'
    : animation === 'bounce'
    ? 'animate-bounce'
    : '';

  const combinedClassName = `${animationClass} ${className}`.trim();

  if (!IconComponent) {
    // Ultimate visual fallback if Lucide is somehow completely unmounted
    return (
      <span
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: '4px',
          backgroundColor: color || 'currentColor',
          opacity: 0.5,
        }}
        className={combinedClassName}
      />
    );
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={combinedClassName}
      {...props}
    />
  );
};

export default Icon;
