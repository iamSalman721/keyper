import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/hooks/useVault';
import { supabase, getCurrentUsername } from '@/integrations/supabase/client';
import { X, Plus } from 'lucide-react';
import { Category } from '../SelfHostedDashboard';

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCredentialAdded: () => void;
}

type CredentialType = 'api_key' | 'login' | 'secret' | 'token' | 'certificate';
type Priority = 'low' | 'medium' | 'high' | 'critical';

export const AddCredentialModal = ({
  isOpen,
  onClose,
  categories,
  onCredentialAdded,
}: AddCredentialModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    credential_type: 'api_key' as CredentialType,
    priority: 'medium' as Priority,
    username: '',
    password: '',
    api_key: '',
    secret_value: '',
    token_value: '',
    certificate_data: '',
    url: '',
    category: '',
    notes: '',
    expires_at: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { encryptCredential, isUnlocked } = useEncryption();

  const credentialTypes = [
    { value: 'api_key', label: 'API Key' },
    { value: 'login', label: 'Login' },
    { value: 'secret', label: 'Secret' },
    { value: 'token', label: 'Token' },
    { value: 'certificate', label: 'Certificate' },
  ] as const;

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!isUnlocked) {
      toast({
        title: "Error",
        description: "Vault must be unlocked to add credentials",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // For self-hosted version, use the current username from settings
      const currentUsername = getCurrentUsername();

      // Encrypt the sensitive credential data
      const { secret_blob, encrypted_at } = await encryptCredential({
        password: formData.password.trim() || undefined,
        api_key: formData.api_key.trim() || undefined,
        secret_value: formData.secret_value.trim() || undefined,
        token_value: formData.token_value.trim() || undefined,
        certificate_data: formData.certificate_data.trim() || undefined,
      });

      // Insert the credential with encrypted data
      const { error } = await supabase.from('credentials').insert({
        user_id: currentUsername,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        credential_type: formData.credential_type,
        priority: formData.priority,
        username: formData.username.trim() || null,
        url: formData.url.trim() || null,
        tags,
        category: formData.category || null,
        notes: formData.notes.trim() || null,
        expires_at: formData.expires_at || null,
        secret_blob,
        encrypted_at,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Credential added successfully",
      });

      onCredentialAdded();
      onClose();
      resetForm();
    } catch (error: unknown) {
      console.error('Error adding credential:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add credential",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setTags([]);
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Add New Credential
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Store and organize your digital credentials securely
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g., GitHub API Key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-white">Type</Label>
              <Select
                value={formData.credential_type}
                onValueChange={(value: CredentialType) => setFormData({...formData, credential_type: value})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {credentialTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Brief description of this credential"
              rows={2}
            />
          </div>

          {/* Credential Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.credential_type === 'login' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </>
            )}

            {formData.credential_type === 'api_key' && (
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="api_key" className="text-white">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}

            {(formData.credential_type === 'secret' || formData.credential_type === 'token') && (
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="secret_value" className="text-white">
                  {formData.credential_type === 'secret' ? 'Secret Value' : 'Token'}
                </Label>
                <Input
                  id="secret_value"
                  type="password"
                  value={formData.secret_value}
                  onChange={(e) => setFormData({...formData, secret_value: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="url" className="text-white">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at" className="text-white">Expires At</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name} className="text-white">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value} className="text-white">
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-white">Tags</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Add a tag"
              />
              <Button
                type="button"
                onClick={addTag}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
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
                      className="ml-1 hover:text-cyan-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Additional notes about this credential"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
              {loading ? 'Adding...' : 'Add Credential'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
