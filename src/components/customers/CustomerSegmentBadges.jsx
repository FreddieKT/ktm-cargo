import { Badge } from '@/components/ui/badge';
import {
  Crown,
  AlertTriangle,
  Sparkles,
  Clock,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';

const behaviorIcons = {
  loyal: Crown,
  at_risk: AlertTriangle,
  new: Sparkles,
  lapsed: Clock,
  returning: RefreshCw,
};

const tierIcons = {
  vip: Crown,
  high: Star,
  medium: TrendingUp,
  low: Users,
};

export function ValueTierBadge({ tier }) {
  if (!tier) return null;
  const Icon = tierIcons[tier.key] || Users;

  return (
    <Badge className={`${tier.color} gap-1`}>
      <Icon className="w-3 h-3" />
      {tier.label}
    </Badge>
  );
}

export function BehavioralBadge({ segment }) {
  if (!segment) return null;
  const Icon = behaviorIcons[segment.key] || Users;

  return (
    <Badge className={`${segment.color} gap-1`}>
      <Icon className="w-3 h-3" />
      {segment.label}
    </Badge>
  );
}

export function CustomerTypeBadge({ type }) {
  const typeConfig = {
    individual: { label: 'Individual', color: 'bg-blue-100 text-blue-800' },
    online_shopper: { label: 'Online Shopper', color: 'bg-purple-100 text-purple-800' },
    sme_importer: { label: 'SME Importer', color: 'bg-amber-100 text-amber-800' },
  };

  const config = typeConfig[type] || typeConfig.individual;

  return <Badge className={config.color}>{config.label}</Badge>;
}

export function CustomerScoreBadge({ score }) {
  let color = 'bg-slate-100 text-slate-800';
  if (score >= 80) color = 'bg-emerald-100 text-emerald-800';
  else if (score >= 60) color = 'bg-blue-100 text-blue-800';
  else if (score >= 40) color = 'bg-amber-100 text-amber-800';
  else color = 'bg-rose-100 text-rose-800';

  return <Badge className={color}>Score: {score}</Badge>;
}

export default function CustomerSegmentBadges({ customer, showScore = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {customer.valueTier && <ValueTierBadge tier={customer.valueTier} />}
      {customer.behavioralSegment && <BehavioralBadge segment={customer.behavioralSegment} />}
      {showScore && customer.customerScore !== undefined && (
        <CustomerScoreBadge score={customer.customerScore} />
      )}
    </div>
  );
}
