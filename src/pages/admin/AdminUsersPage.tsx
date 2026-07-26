import { useEffect, useState } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { listAdminTable } from '../../services/admin.service';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { toast } from '../../lib/toast';
import { Icon } from '../../components/ui/Icon';
import type { Profile } from '../../types';

export function AdminUsersPage() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletId, setWalletId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await listAdminTable('profiles');
      setRows(data as Profile[]);
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = async (user: Profile) => {
    setEditingUser(user);
    setWalletAddress('');
    setWalletId(null);
    // Fetch wallet info
    if (supabase) {
      const { data } = await supabase
        .from('wallets')
        .select('id, solana_address')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setWalletId(data.id);
        setWalletAddress((data as any).solana_address || '');
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser || !supabase) return;
    
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          currency: formData.get('currency'),
          country: formData.get('country'),
          timezone: formData.get('timezone'),
        })
        .eq('id', editingUser.id);
        
      if (profileError) throw profileError;

      // Update wallet if it exists
      if (walletId) {
        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            solana_address: formData.get('solana_address') || null,
          })
          .eq('id', walletId);
          
        if (walletError) throw walletError;
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  if (error) return <EmptyState title="Users unavailable" description={error} />;

  const columns = [
    { key: 'display_name', header: 'Name', render: (row: Profile) => row.display_name || 'N/A' },
    { key: 'email', header: 'Email', render: (row: Profile) => row.email || 'N/A' },
    { key: 'role', header: 'Role', render: (row: Profile) => <span className="capitalize">{row.role}</span> },
    { key: 'country', header: 'Country', render: (row: Profile) => row.country?.split(' ')[0].toUpperCase() || '-' },
    { key: 'currency', header: 'Currency', render: (row: Profile) => row.currency?.split(' ')[0] || '-' },
    { key: 'created_at', header: 'Joined', render: (row: Profile) => new Date(row.created_at).toLocaleDateString() },
    { 
      key: 'actions', 
      header: '', 
      align: 'right' as const,
      render: (row: Profile) => (
        <Button variant="outline" size="sm" onClick={() => handleEditClick(row)}>
          <Icon name="edit" size={14} className="mr-2" /> Edit
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Users</h1>
      {loading ? (
        <div className="animate-pulse h-64 bg-surface rounded-2xl border border-border"></div>
      ) : (
        <DataTable 
          rows={rows} 
          keyField="id" 
          columns={columns.length ? columns : [{ key: 'empty', header: 'Data', render: () => 'No rows' }]} 
        />
      )}

      {editingUser && (
        <Modal
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          title="Edit User Payout Settings"
          description={`Updating settings for ${editingUser.display_name || editingUser.email}`}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Select 
              name="currency" 
              label="Currency"
              defaultValue={editingUser.currency || "USD - US Dollar ($)"}
            >
              <option value="USD - US Dollar ($)">USD - US Dollar ($)</option>
              <option value="EUR - Euro (€)">EUR - Euro (€)</option>
              <option value="GBP - British Pound (£)">GBP - British Pound (£)</option>
            </Select>

            <Select 
              name="country" 
              label="Country"
              defaultValue={editingUser.country || "us United States of America"}
            >
              <option value="us United States of America">us United States of America</option>
              <option value="ca Canada">ca Canada</option>
              <option value="gb United Kingdom">gb United Kingdom</option>
              <option value="in India">in India</option>
            </Select>

            <Select 
              name="timezone" 
              label="Timezone"
              defaultValue={editingUser.timezone || "(GMT-05:00) Eastern Time (US & Canada)"}
            >
              <option value="(GMT-05:00) Eastern Time (US & Canada)">(GMT-05:00) Eastern Time (US & Canada)</option>
              <option value="(GMT-08:00) Pacific Time (US & Canada)">(GMT-08:00) Pacific Time (US & Canada)</option>
              <option value="(GMT+00:00) Coordinated Universal Time">(GMT+00:00) Coordinated Universal Time</option>
              <option value="(GMT+05:30) India Standard Time">(GMT+05:30) India Standard Time</option>
            </Select>

            <div className="pt-2 border-t border-border">
              <Input 
                name="solana_address"
                label="Solana Wallet Address"
                defaultValue={walletAddress}
                placeholder="e.g. F7SzVwEQdXzEwGEqj..."
              />
              {!walletId && <p className="text-xs text-text-secondary mt-1">This user does not have a wallet initialized yet.</p>}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
