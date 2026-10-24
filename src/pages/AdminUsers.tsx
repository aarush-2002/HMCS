import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Upload, User, Shield, AlertTriangle } from 'lucide-react';
import { AdminShell } from '../components/AdminShell';
import { CalmBackground } from '../components/CalmBackground';
import { Input, Button, Select } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getStore, getUserById } from '../store/data';
import { User as UserType, Role } from '../shared/types';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    const store = getStore();
    setUsers(store.users);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(user => {
    if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDeactivate = (userId: string) => {
    // In real app, this would call an API
    console.log('Deactivating user:', userId);
    setShowDeactivateDialog(null);
  };

  const handleResetPassword = (userId: string) => {
    // In real app, this would call an API
    console.log('Resetting password for user:', userId);
    setShowResetDialog(null);
  };

  const handleCSVImport = (file: File) => {
    // In real app, this would parse CSV and validate
    console.log('Importing CSV:', file.name);
    setShowImportDialog(false);
  };

  return (
    <>
      <CalmBackground />
      <AdminShell adminName="Dr. Admin">
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow eyebrow-ember mb-2">Users</div>
              <h1 className="display display-lg">Manage users</h1>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                icon={<Upload className="w-4 h-4" />}
                onClick={() => setShowImportDialog(true)}
              >
                Import CSV
              </Button>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreateDialog(true)}
              >
                Create User
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-ink-2/50 border border-line rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-ink border border-line rounded-lg text-sm text-bone placeholder:text-muted focus:outline-none focus:border-ember transition-colors"
                />
              </div>
              <Select
                label="Role"
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { value: 'ALL', label: 'All Roles' },
                  { value: Role.STUDENT, label: 'Students' },
                  { value: Role.WARDEN, label: 'Wardens' },
                  { value: Role.ADMIN, label: 'Admins' },
                ]}
              />
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="bg-ink-2/50 border border-line rounded-xl p-6 animate-pulse">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-line rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-line rounded w-1/3" />
                      <div className="h-3 bg-line rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-ink-2 border border-line rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-xl text-bone mb-2">No users found</h3>
              <p className="text-bone-dim">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="bg-ink-2/50 border border-line rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-line bg-ink/50 text-xs text-bone-dim uppercase tracking-wider">
                <div className="col-span-4">User</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Hostel</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-line">
                {filteredUsers.map((user, idx) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-ink/30 transition-colors"
                  >
                    {/* User */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === Role.ADMIN ? 'bg-purple-500/20' :
                        user.role === Role.WARDEN ? 'bg-amber-500/20' :
                        'bg-ember/20'
                      }`}>
                        <span className={`text-sm font-medium ${
                          user.role === Role.ADMIN ? 'text-purple-400' :
                          user.role === Role.WARDEN ? 'text-amber-400' :
                          'text-ember'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-bone">{user.name}</p>
                        <p className="text-xs text-muted">{user.id}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 flex items-center">
                      <p className="text-sm text-bone-dim">{user.email}</p>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 flex items-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === Role.ADMIN ? 'bg-purple-500/20 text-purple-400' :
                        user.role === Role.WARDEN ? 'bg-amber-500/20 text-amber-400' :
                        'bg-ember/20 text-ember'
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    {/* Hostel */}
                    <div className="col-span-2 flex items-center">
                      <p className="text-sm text-bone-dim">{user.hostelId}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center gap-2">
                      <button
                        onClick={() => setShowResetDialog(user.id)}
                        className="p-1.5 text-bone-dim hover:text-ember transition-colors"
                        title="Reset password"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      {user.role !== Role.ADMIN && (
                        <button
                          onClick={() => setShowDeactivateDialog(user.id)}
                          className="p-1.5 text-bone-dim hover:text-emergency transition-colors"
                          title="Deactivate user"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Create User Dialog */}
          <ConfirmDialog
            isOpen={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            onConfirm={() => {
              console.log('Creating user...');
              setShowCreateDialog(false);
            }}
            title="Create New User"
            message="This will open a form to create a new user account. Continue?"
            confirmLabel="Continue"
          />

          {/* Deactivate User Dialog */}
          <ConfirmDialog
            isOpen={showDeactivateDialog !== null}
            onClose={() => setShowDeactivateDialog(null)}
            onConfirm={() => showDeactivateDialog && handleDeactivate(showDeactivateDialog)}
            title="Deactivate User"
            message="Are you sure you want to deactivate this user? They will no longer be able to access the system."
            confirmLabel="Deactivate"
            variant="danger"
          />

          {/* Reset Password Dialog */}
          <ConfirmDialog
            isOpen={showResetDialog !== null}
            onClose={() => setShowResetDialog(null)}
            onConfirm={() => showResetDialog && handleResetPassword(showResetDialog)}
            title="Reset Password"
            message="This will generate a new temporary password for the user. They will be required to change it on next login."
            confirmLabel="Reset Password"
          />

          {/* Import CSV Dialog */}
          <ConfirmDialog
            isOpen={showImportDialog}
            onClose={() => setShowImportDialog(false)}
            onConfirm={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleCSVImport(file);
              };
              input.click();
            }}
            title="Import Users from CSV"
            message="Upload a CSV file with user data. The file should include columns for name, email, role, and hostel."
            confirmLabel="Select File"
          />
        </div>
      </AdminShell>
    </>
  );
}
