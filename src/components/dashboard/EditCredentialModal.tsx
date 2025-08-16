
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  X,
  Plus,
  Save,
  Loader2
} from 'lucide-react';
import { Credential, Category } from '../SelfHostedDashboard';

interface EditCredentialModalProps {
  credential: Credential | null;
  onClose: () => void;
  categories: Category[];
  onCredentialUpdated: () => void;
}

export const EditCredentialModal = ({
  credential,
  onClose,
  categories,
  onCredentialUpdated,
}: EditCredentialModalProps) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    credential_type: 'api_key' | 'login' | 'secret' | 'token' | 'certificate';
    priority: 'low' | 'medium' | 'high' | 'critical';
    username: string;
    password: string;
    api_key: string;
    secret_value: string;
    url: string;
    category: string;
    notes: string;
    expires_at: string;
  }>({
    title: '',
    description: '',
    credential_type: 'api_key',
    priority: 'medium',
    username: '',
    password: '',
    api_key: '',
    secret_value: '',
    url: '',
    category: '',
    notes: '',
    expires_at: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (credential) {
      setFormData({
        title: credential.title,
        description: credential.description || '',
        credential_type: credential.credential_type,
        priority: credential.priority,
        username: credential.username || '',
        password: credential.password || '',
        api_key: credential.api_key || '',
        secret_value: credential.secret_value || '',
        url: credential.url || '',
        category: credential.category || '',
        notes: credential.notes || '',
        expires_at: credential.expires_at ? credential.expires_at.split('T')[0] : '',
      });
      setTags(credential.tags || []);
    }
  }, [credential]);

  if (!credential) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        tags,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('credentials')
        .update(updateData)
        .eq('id', credential.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Credential updated successfully",
      });

      onCredentialUpdated();
      onClose();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message || "Failed to update credential",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={!!credential} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Edit Credential
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Update your credential information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Type *</label>
              <select
                value={formData.credential_type}
                onChange={(e) => setFormData({ ...formData, credential_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                required
              >
                <option value="api_key">API Key</option>
                <option value="login">Login</option>
                <option value="secret">Secret</option>
                <option value="token">Token</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
            />
          </div>

          {/* Credential Fields */}
          <div className="space-y-4">
            {(formData.credential_type === 'login' || formData.credential_type === 'api_key') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Username</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}

            {formData.credential_type === 'login' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}

            {formData.credential_type === 'api_key' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">API Key</label>
                <Input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}

            {(formData.credential_type === 'secret' || formData.credential_type === 'token') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Secret Value</label>
                <Input
                  type="password"
                  value={formData.secret_value}
                  onChange={(e) => setFormData({ ...formData, secret_value: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">URL</label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-cyan-900/50 text-cyan-300 border-cyan-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Expiration Date</label>
            <Input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Credential
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
