import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | string;
  isImage?: boolean;
  keywords?: string[];
}

export type MegaMenuId = 'guides' | 'tools' | null;
