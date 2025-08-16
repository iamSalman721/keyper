import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Key,
  User,
  Shield,
  Code,
  Award,
  ExternalLink,
  Calendar,
  Clock
} from 'lucide-react';
import { Credential, Category } from '../SelfHostedDashboard';
import { EditCredentialModal } from './EditCredentialModal';

interface CredentialDetailModalProps {
  credential: Credential | null;
  onClose: () => void;
  categories: Category[];
  onCredentialUpdated: () => void;
}

export const CredentialDetailModal = ({
  credential,
  onClose,
  categories,
  onCredentialUpdated,
}: CredentialDetailModalProps) => {
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  if (!credential) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api_key':
        return <Key className="h-5 w-5" />;
      case 'login':
        return <User className="h-5 w-5" />;
      case 'secret':
        return <Shield className="h-5 w-5" />;
      case 'token':
        return <Code className="h-5 w-5" />;
      case 'certificate':
        return <Award className="h-5 w-5" />;
      default:
        return <Key className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const toggleVisibility = (field: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('id', credential.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Credential deleted successfully",
      });

      onCredentialUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete credential",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLastAccessed = async () => {
    try {
      await supabase
        .from('credentials')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', credential.id);
    } catch (error) {
      console.error('Error updating last accessed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const SensitiveField = ({
    label,
    value,
    field
  }: {
    label: string;
    value: string | null;
    field: string;
  }) => {
    if (!value) return null;

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-md font-mono text-sm">
            {showSensitive[field] ? value : '•'.repeat(Math.min(value.length, 20))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleVisibility(field)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {showSensitive[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              copyToClipboard(value, label);
              updateLastAccessed();
            }}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={!!credential} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                  {getTypeIcon(credential.credential_type)}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    {credential.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-400 capitalize">
                    {credential.credential_type.replace('_', ' ')}
                  </DialogDescription>
                </div>
              </div>
              <Badge className={getPriorityColor(credential.priority)}>
                {credential.priority}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {credential.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <p className="text-gray-200 p-3 bg-gray-800/50 rounded-md border border-gray-700">
                  {credential.description}
                </p>
              </div>
            )}

            {/* Credential Fields */}
            <div className="space-y-4">
              <SensitiveField
                label="Username"
                value={credential.username}
                field="username"
              />
              <SensitiveField
                label="Password"
                value={credential.password}
                field="password"
              />
              <SensitiveField
                label="API Key"
                value={credential.api_key}
                field="api_key"
              />
              <SensitiveField
                label="Secret Value"
                value={credential.secret_value}
                field="secret_value"
              />
            </div>

            {credential.url && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">URL</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-md text-sm">
                    {credential.url}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(credential.url!, '_blank')}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credential.url!, 'URL')}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {credential.category && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Category</label>
                  <p className="text-gray-200 p-2 bg-gray-800/50 rounded border border-gray-700">
                    {credential.category}
                  </p>
                </div>
              )}

              {credential.expires_at && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Expires At
                  </label>
                  <p className="text-gray-200 p-2 bg-gray-800/50 rounded border border-gray-700">
                    {formatDate(credential.expires_at)}
                  </p>
                </div>
              )}
            </div>

            {credential.tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {credential.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-cyan-900/50 text-cyan-300 border-cyan-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {credential.notes && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Notes</label>
                <p className="text-gray-200 p-3 bg-gray-800/50 rounded-md border border-gray-700 whitespace-pre-wrap">
                  {credential.notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <label className="text-gray-400">Created</label>
                <p className="text-gray-300">{formatDate(credential.created_at)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-gray-400">Updated</label>
                <p className="text-gray-300">{formatDate(credential.updated_at)}</p>
              </div>
              {credential.last_accessed && (
                <div className="space-y-1">
                  <label className="text-gray-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Last Accessed
                  </label>
                  <p className="text-gray-300">{formatDate(credential.last_accessed)}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-gray-700">
              <Button
                onClick={handleDelete}
                disabled={loading}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? 'Deleting...' : 'Delete'}
              </Button>

              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditCredentialModal
        credential={isEditModalOpen ? credential : null}
        onClose={() => setIsEditModalOpen(false)}
        categories={categories}
        onCredentialUpdated={() => {
          onCredentialUpdated();
          setIsEditModalOpen(false);
        }}
      />
    </>
  );
};
