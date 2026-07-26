import { useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Input, Select } from "./Input";
import { supabase } from "../../lib/supabase";
import { Icon } from "./Icon";
import { toast } from '../../lib/toast';

export function AccountSettings() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    username: profile?.username || "",
    currency: profile?.currency || "USD - US Dollar ($)",
    country: profile?.country || "us United States of America",
    timezone: profile?.timezone || "(GMT-05:00) Eastern Time (US & Canada)"
  });

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!supabase) throw new Error('Supabase client is not initialized');
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      setUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      toast.success('Avatar uploaded successfully. Don\'t forget to save changes.');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    if (!supabase) {
      toast.error('Supabase client is not initialized');
      return;
    }
    setIsSaving(true);
    try {
      const updates = {
        ...formData,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const { data, error: fnError } = await supabase.functions.invoke("delete-account", {
        method: "POST",
      });
      if (fnError) {
        throw new Error(fnError.message || "Function execution failed");
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      // Deletion succeeded: sign out
      await signOut();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Details Card */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-bold text-text-primary">Profile Details</h2>
          <p className="text-sm text-text-secondary mt-1">Update your profile information</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column: Avatar */}
            <div className="flex flex-col items-center justify-start space-y-4 md:w-[250px] shrink-0">
              <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-surface shadow-[0_4px_12px_rgba(0,0,0,0.1)] group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={formData.display_name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-accent-subtle text-accent flex items-center justify-center text-4xl font-bold">
                    {formData.display_name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                
                {/* Decorative border/glow like image */}
                <div className="absolute inset-0 rounded-full border-2 border-accent/20 mix-blend-overlay"></div>
              </div>
              
              <div className="text-center space-y-3">
                <p className="text-xs text-text-secondary">Allowed PNG, JPEG or GIF. Max size of 5MB.</p>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/gif" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                />
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingAvatar}
                >
                  Upload New Avatar
                </Button>
              </div>
            </div>

            {/* Right Column: Form Fields */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <Input
                  name="display_name"
                  label="Display Name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder="Your display name"
                />
              </div>
              <div>
                <Select 
                  name="currency" 
                  label="Currency *"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="USD - US Dollar ($)">USD - US Dollar ($)</option>
                  <option value="EUR - Euro (€)">EUR - Euro (€)</option>
                  <option value="GBP - British Pound (£)">GBP - British Pound (£)</option>
                </Select>
              </div>
              
              <div className="relative">
                <Input
                  name="email"
                  label="Email"
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="pr-16 opacity-70 cursor-not-allowed bg-surface-hover"
                />
                <button className="absolute right-3 top-[34px] text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                  Change
                </button>
              </div>
              <div>
                <Select 
                  name="country" 
                  label="Country *"
                  value={formData.country}
                  onChange={handleInputChange}
                >
                  <option value="us United States of America">us United States of America</option>
                  <option value="ca Canada">ca Canada</option>
                  <option value="gb United Kingdom">gb United Kingdom</option>
                  <option value="in India">in India</option>
                </Select>
              </div>
              
              <div>
                <Input
                  name="username"
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Your username"
                />
                <p className="text-[11px] text-text-secondary mt-1.5">You can change your username once every 14 days</p>
              </div>
              <div>
                <Select 
                  name="timezone" 
                  label="Timezone *"
                  value={formData.timezone}
                  onChange={handleInputChange}
                >
                  <option value="(GMT-05:00) Eastern Time (US & Canada)">(GMT-05:00) Eastern Time (US & Canada)</option>
                  <option value="(GMT-08:00) Pacific Time (US & Canada)">(GMT-08:00) Pacific Time (US & Canada)</option>
                  <option value="(GMT+00:00) Coordinated Universal Time">(GMT+00:00) Coordinated Universal Time</option>
                  <option value="(GMT+05:30) India Standard Time">(GMT+05:30) India Standard Time</option>
                </Select>
                <p className="text-[11px] text-text-secondary mt-1.5">It's {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })} in your area.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-border/50 flex justify-end">
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            Save Changes
          </Button>
        </div>
      </section>

      {/* Account Actions / Danger Zone */}
      <section className="rounded-2xl border border-danger/30 bg-danger/5 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Icon name="shield-alert" size={20} className="text-danger" />
              <h3 className="font-semibold text-danger">Danger zone</h3>
            </div>
            <p className="text-sm text-text-secondary">
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={signOut}>
              <Icon name="log-out" size={16} className="mr-2" />
              Sign out
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              <Icon name="trash" size={16} className="mr-2" />
              Delete account
            </Button>
          </div>
        </div>
      </section>

      <Modal
        open={showDeleteModal}
        title="Delete account"
        description="This action cannot be undone. All your data will be permanently removed."
        onClose={() => setShowDeleteModal(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Type <span className="font-mono font-bold text-danger">DELETE</span> to confirm:
          </p>
          <Input
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder="Type DELETE to confirm"
            className="font-mono"
          />
          {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="danger" type="button" onClick={() => void handleDeleteAccount()} loading={isDeleting} disabled={deleteConfirmation !== 'DELETE'}>Delete account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
