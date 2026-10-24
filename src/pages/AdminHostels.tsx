import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, MapPin } from 'lucide-react';
import { AdminShell } from '../components/AdminShell';
import { CalmBackground } from '../components/CalmBackground';
import { Button, Input } from '../components/ui';
import { getStore } from '../store/data';

export default function AdminHostels() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const store = getStore();
    // Group users by hostel
    const hostelMap = new Map();
    store.users.forEach(user => {
      if (!hostelMap.has(user.hostelId)) {
        hostelMap.set(user.hostelId, {
          id: user.hostelId,
          name: `Hostel ${user.hostelId}`,
          students: 0,
          wardens: 0,
        });
      }
      const hostel = hostelMap.get(user.hostelId);
      if (user.role === 'STUDENT') hostel.students++;
      if (user.role === 'WARDEN') hostel.wardens++;
    });
    setHostels(Array.from(hostelMap.values()));
    setLoading(false);
  }, []);

  return (
    <>
      <CalmBackground />
      <AdminShell adminName="Dr. Admin">
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow eyebrow-ember mb-2">Hostels</div>
              <h1 className="display display-lg">Manage hostels</h1>
            </div>
            <Button variant="primary" icon={<Building2 className="w-4 h-4" />}>
              Add Hostel
            </Button>
          </div>

          {/* Hostels Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-ink-2/50 border border-line rounded-xl p-6 animate-pulse">
                  <div className="h-32 bg-line rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostels.map((hostel, idx) => (
                <motion.div
                  key={hostel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-ink-2/50 border border-line rounded-xl p-6 hover:border-ember/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-ember/20 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-ember" />
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>

                  <h3 className="text-lg font-medium text-bone mb-2">{hostel.name}</h3>
                  <p className="text-xs text-muted mb-4">{hostel.id}</p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-bone-dim" />
                      <span className="text-bone-dim">{hostel.students} students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span className="text-bone-dim">{hostel.wardens} wardens</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-line">
                    <Button variant="ghost" size="sm" className="w-full">
                      Manage Assignments
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </AdminShell>
    </>
  );
}
