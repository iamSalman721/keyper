/**
 * EncryptedCredentialDetailModal - Enhanced credential detail view with encryption support
 * 
 * Displays credential details with support for encrypted fields using EncryptedField components.
 * Provides secure viewing, editing, and management of encrypted credentials.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Edit,
  Trash2,
  Key,
  User,
  Shield,
  ShieldCheck,
  Code,
  Award,
  ExternalLink,
  Calendar,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import EncryptedField from '@/components/EncryptedField';
import { useEncryption } from '@/hooks/useVault';
import type { Credential, Category } from '../SelfHostedDashboard';
import type { SecretBlobV1 } from '@/crypto/types';

interface EncryptedCredentialDetailModalProps {
  credential: Credential | null;
  onClose: () => void;
  categories: Category[];
  onCredentialUpdated: () => void;
}

export default function EncryptedCredentialDetailModal({
  credential,
  onClose,
  categories,
  onCredentialUpdated,
}: EncryptedCredentialDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [decryptedSecrets, setDecryptedSecrets] = useState<any>(null);
  const { toast } = useToast();
  const vault = useEncryption();

  if (!credential) return null;

  // Determine if credential is encrypted
  const isEncrypted = credential.secret_blob !== null && credential.secret_blob !== undefined;
  const hasSecrets = isEncrypted || !!(
    credential.password ||
    credential.api_key ||
    credential.secret_value ||
    credential.token_value ||
    credential.certificate_data
  );

  // Get category info
  const category = categories.find(c => c.id === credential.category);

  // Priority colors
  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  // Type icons
  const typeIcons = {
    api_key: Key,
    login: User,
    secret: Shield,
    token: Code,
    certificate: Award,
  };

  const TypeIcon = typeIcons[credential.credential_type] || Key;

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
        title: "🗑️ Credential Deleted",
        description: "Credential has been permanently deleted",
      });

      onCredentialUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "❌ Delete Failed",
        description: error.message || "Failed to delete credential",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = credential.expires_at && new Date(credential.expires_at) < new Date();
  const isExpiringSoon = credential.expires_at && 
    new Date(credential.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Dialog open={!!credential} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TypeIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{credential.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize">
                    {credential.credential_type.replace('_', ' ')}
                  </Badge>
                  <Badge 
                    className={`text-white ${priorityColors[credential.priority]}`}
                  >
                    {credential.priority}
                  </Badge>
                  {isEncrypted && (
                    <Badge variant="default" className="bg-green-500">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  )}
                  {!isEncrypted && hasSecrets && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Plaintext
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {}}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {credential.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{credential.description}</p>
                </div>
              )}
              
              {credential.url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm">{credential.url}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(credential.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {credential.username && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-sm mt-1">{credential.username}</p>
                </div>
              )}

              {category && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <Badge variant="outline" className="mt-1" style={{ backgroundColor: category.color + '20', borderColor: category.color }}>
                    {category.name}
                  </Badge>
                </div>
              )}

              {credential.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {credential.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sensitive Data */}
          {hasSecrets && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Sensitive Data</CardTitle>
                  {!vault.isUnlocked && isEncrypted && (
                    <Badge variant="destructive">
                      <Lock className="h-3 w-3 mr-1" />
                      Vault Locked
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {isEncrypted 
                    ? "Encrypted credential data - unlock vault to view"
                    : "Plaintext credential data"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {credential.credential_type === 'login' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Password</label>
                    <EncryptedField
                      encryptedBlob={credential.secret_blob ? JSON.parse(JSON.stringify(credential.secret_blob)) : null}
                      plaintextValue={credential.password}
                      label="Password"
                      placeholder="No password set"
                      showEncryptionStatus={true}
                    />
                  </div>
                )}

                {credential.credential_type === 'api_key' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">API Key</label>
                    <EncryptedField
                      encryptedBlob={credential.secret_blob ? JSON.parse(JSON.stringify(credential.secret_blob)) : null}
                      plaintextValue={credential.api_key}
                      label="API Key"
                      placeholder="No API key set"
                      showEncryptionStatus={true}
                    />
                  </div>
                )}

                {credential.credential_type === 'secret' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Secret Value</label>
                    <EncryptedField
                      encryptedBlob={credential.secret_blob ? JSON.parse(JSON.stringify(credential.secret_blob)) : null}
                      plaintextValue={credential.secret_value}
                      label="Secret Value"
                      placeholder="No secret value set"
                      showEncryptionStatus={true}
                    />
                  </div>
                )}

                {credential.credential_type === 'token' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Token</label>
                    <EncryptedField
                      encryptedBlob={credential.secret_blob ? JSON.parse(JSON.stringify(credential.secret_blob)) : null}
                      plaintextValue={credential.token_value}
                      label="Token"
                      placeholder="No token set"
                      showEncryptionStatus={true}
                    />
                  </div>
                )}

                {credential.credential_type === 'certificate' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Certificate Data</label>
                    <EncryptedField
                      encryptedBlob={credential.secret_blob ? JSON.parse(JSON.stringify(credential.secret_blob)) : null}
                      plaintextValue={credential.certificate_data}
                      label="Certificate Data"
                      placeholder="No certificate data set"
                      showEncryptionStatus={true}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-muted-foreground">Created</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(credential.created_at)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="font-medium text-muted-foreground">Updated</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(credential.updated_at)}</span>
                  </div>
                </div>

                {credential.expires_at && (
                  <div className="col-span-2">
                    <label className="font-medium text-muted-foreground">Expires</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : ''}>
                        {formatDate(credential.expires_at)}
                        {isExpired && ' (Expired)'}
                        {isExpiringSoon && !isExpired && ' (Expires Soon)'}
                      </span>
                    </div>
                  </div>
                )}

                {credential.encrypted_at && (
                  <div className="col-span-2">
                    <label className="font-medium text-muted-foreground">Encrypted</label>
                    <div className="flex items-center gap-2 mt-1">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span>{formatDate(credential.encrypted_at)}</span>
                      <Badge variant="outline" className="text-xs">
                        {credential.secret_blob?.kdf === 'argon2id' ? 'Argon2id' : 'PBKDF2'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {credential.notes && (
                <div>
                  <label className="font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md">{credential.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
