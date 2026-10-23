import React from 'react';
import { AuditEvent } from '../../shared/types';
import { getUserById } from '../../store/data';
import {
  FileText, CheckCircle, Zap, Clock, AlertTriangle, Star,
  TrendingDown, User, Edit3, ArrowRight,
} from 'lucide-react';

interface AuditTimelineProps {
  events: AuditEvent[];
  compact?: boolean;
  showActor?: boolean;
}

export function AuditTimeline({ events, compact = false, showActor = true }: AuditTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--stone-500)]">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  const getIcon = (action: string) => {
    if (action.includes('CREATED')) return <FileText className="w-4 h-4" />;
    if (action.includes('STATUS')) return <Edit3 className="w-4 h-4" />;
    if (action.includes('PROMOTED')) return <Zap className="w-4 h-4" />;
    if (action.includes('RESOLVED')) return <CheckCircle className="w-4 h-4" />;
    if (action.includes('REOPENED')) return <AlertTriangle className="w-4 h-4" />;
    if (action.includes('RATING')) return <Star className="w-4 h-4" />;
    if (action.includes('PENALTY')) return <TrendingDown className="w-4 h-4" />;
    if (action.includes('UPVOTE')) return <ArrowRight className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (action.includes('STATUS')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (action.includes('PROMOTED')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('RESOLVED')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('REOPENED')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (action.includes('RATING')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (action.includes('PENALTY')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-[var(--stone-100)] text-[var(--stone-600)] border-[var(--stone-200)]';
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const actor = getUserById(event.actorId);
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${getColor(event.action)}`}>
                {getIcon(event.action)}
              </div>
              {!isLast && <div className="w-px flex-1 bg-[var(--stone-200)] my-1" />}
            </div>

            {/* Content */}
            <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className={`font-medium text-[var(--stone-800)] ${compact ? 'text-sm' : 'text-sm'}`}>
                    {formatAction(event.action)}
                  </p>
                  {showActor && actor && (
                    <p className="text-xs text-[var(--stone-500)] mt-0.5">
                      by {actor.name}
                    </p>
                  )}
                  {event.reason ? (
                    <p className="text-xs text-[var(--stone-600)] mt-1 italic">
                      Reason: {String(event.reason)}
                    </p>
                  ) : null}
                  {(event.after?.status || event.after?.priority) ? (
                    <div className="flex items-center gap-2 mt-1">
                      {event.before?.status && event.after?.status ? (
                        <p className="text-xs text-[var(--stone-600)]">
                          {String(event.before.status).replace(/_/g, ' ')} → {String(event.after.status).replace(/_/g, ' ')}
                        </p>
                      ) : null}
                      {event.before?.priority && event.after?.priority ? (
                        <p className="text-xs text-[var(--stone-600)]">
                          {String(event.before.priority)} → {String(event.after.priority)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-[var(--stone-400)] whitespace-nowrap">
                  {new Date(event.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
