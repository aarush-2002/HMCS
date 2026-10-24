import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, FileText } from 'lucide-react';
import { AdminShell } from '../components/AdminShell';
import { CalmBackground } from '../components/CalmBackground';
import { Select } from '../components/ui';
import { AuditTimeline } from '../components/ui/AuditTimeline';
import { getStore, getUserById } from '../store/data';
import { AuditEvent } from '../shared/types';

export default function AdminAudit() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  useEffect(() => {
    const store = getStore();
    setAuditEvents(store.auditEvents);
    setLoading(false);
  }, []);

  const filteredEvents = auditEvents.filter(event => {
    if (actionFilter !== 'ALL' && event.action !== actionFilter) return false;
    if (entityFilter !== 'ALL' && event.entityType !== entityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const actor = getUserById(event.actorId);
      return (
        event.action.toLowerCase().includes(q) ||
        event.entityId.toLowerCase().includes(q) ||
        (actor && actor.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(auditEvents.map(e => e.action)));
  const uniqueEntities = Array.from(new Set(auditEvents.map(e => e.entityType)));

  return (
    <>
      <CalmBackground />
      <AdminShell adminName="Dr. Admin">
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div>
            <div className="eyebrow eyebrow-ember mb-2">Audit</div>
            <h1 className="display display-lg mb-4">Audit log</h1>
            <p className="text-bone-dim">
              Complete history of all system changes. This log is append-only and cannot be modified.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-ink-2/50 border border-line rounded-xl p-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-ember shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-bone font-medium mb-1">Append-Only Log</p>
                <p className="text-sm text-bone-dim">
                  This audit log is immutable. All changes are permanently recorded and cannot be deleted or modified. The database user for this application does not have DELETE privileges on the audit_events table.
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-ink-2/50 border border-line rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-bone-dim" />
              <span className="text-sm text-bone-dim uppercase tracking-wider">Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by actor, action, or entity..."
                  className="w-full pl-10 pr-4 py-2.5 bg-ink border border-line rounded-lg text-sm text-bone placeholder:text-muted focus:outline-none focus:border-ember transition-colors"
                />
              </div>

              {/* Action Filter */}
              <Select
                label="Action"
                value={actionFilter}
                onChange={setActionFilter}
                options={[
                  { value: 'ALL', label: 'All Actions' },
                  ...uniqueActions.map(action => ({
                    value: action,
                    label: action.replace(/_/g, ' '),
                  })),
                ]}
              />

              {/* Entity Filter */}
              <Select
                label="Entity Type"
                value={entityFilter}
                onChange={setEntityFilter}
                options={[
                  { value: 'ALL', label: 'All Entities' },
                  ...uniqueEntities.map(entity => ({
                    value: entity,
                    label: entity,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-ink-2/50 border border-line rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm text-bone-dim uppercase tracking-wider">
                Timeline ({filteredEvents.length} events)
              </h3>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 animate-pulse">
                    <div className="w-8 h-8 bg-line rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-line rounded w-1/2" />
                      <div className="h-3 bg-line rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-ink-2 border border-line rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted" />
                </div>
                <h3 className="text-xl text-bone mb-2">No audit events found</h3>
                <p className="text-bone-dim">
                  Try adjusting your filters or search query.
                </p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                <AuditTimeline events={filteredEvents} showActor={true} />
              </div>
            )}
          </div>
        </div>
      </AdminShell>
    </>
  );
}
