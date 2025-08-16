/**
 * EncryptedField - Secure reveal/hide component for encrypted credential data
 * 
 * Provides a secure interface for displaying encrypted credential values
 * with reveal/hide functionality, auto-hide timers, and copy-to-clipboard.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

import React, { useState, useEffect, useCallback } from 'react';
import { vaultManager } from '@/services/VaultManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  AlertTriangle, 
  Lock,
  Timer,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SecretBlobV1 } from '@/crypto/types';
import { CryptoError, CryptoErrorType } from '@/crypto/types';

interface EncryptedFieldProps {
  /** The encrypted blob containing the secret data */
  encryptedBlob: SecretBlobV1 | null;
  /** Fallback plaintext value (for backward compatibility) */
  plaintextValue?: string | null;
  /** Field label for accessibility */
  label?: string;
  /** Placeholder text when no value is present */
  placeholder?: string;
  /** Auto-hide timeout in milliseconds (default: 30 seconds) */
  autoHideMs?: number;
  /** Whether to show copy button */
  showCopy?: boolean;
  /** Whether to show encryption status */
  showEncryptionStatus?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when value is revealed */
  onReveal?: () => void;
  /** Callback when value is hidden */
  onHide?: () => void;
  /** Callback when value is copied */
  onCopy?: () => void;
}

export default function EncryptedField({
  encryptedBlob,
  plaintextValue,
  label = "Secret",
  placeholder = "No value set",
  autoHideMs = 30000, // 30 seconds default
  showCopy = true,
  showEncryptionStatus = true,
  className = "",
  onReveal,
  onHide,
  onCopy
}: EncryptedFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilHide, setTimeUntilHide] = useState(0);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();

  // Determine if we have encrypted or plaintext data
  const hasEncryptedData = encryptedBlob !== null;
  const hasPlaintextData = plaintextValue !== null && plaintextValue !== undefined && plaintextValue !== '';
  const hasAnyData = hasEncryptedData || hasPlaintextData;
  const isEncrypted = hasEncryptedData;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [hideTimer]);

  // Update countdown timer
  useEffect(() => {
    if (!isRevealed || autoHideMs <= 0) return;
    
    const interval = setInterval(() => {
      setTimeUntilHide(prev => {
        if (prev <= 1000) {
          handleHide();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRevealed, autoHideMs]);

  const handleReveal = useCallback(async () => {
    if (!hasAnyData) return;
    
    // If we have plaintext data, show it directly
    if (!isEncrypted && hasPlaintextData) {
      setDecryptedValue(plaintextValue);
      setIsRevealed(true);
      setError(null);
      onReveal?.();
      
      // Set auto-hide timer
      if (autoHideMs > 0) {
        setTimeUntilHide(autoHideMs);
        const timer = setTimeout(() => {
          handleHide();
        }, autoHideMs);
        setHideTimer(timer);
      }
      return;
    }
    
    // Handle encrypted data
    if (!encryptedBlob) return;
    
    setIsDecrypting(true);
    setError(null);
    
    try {
      const decrypted = await vaultManager.decrypt(encryptedBlob);
      setDecryptedValue(decrypted);
      setIsRevealed(true);
      onReveal?.();
      
      // Set auto-hide timer
      if (autoHideMs > 0) {
        setTimeUntilHide(autoHideMs);
        const timer = setTimeout(() => {
          handleHide();
        }, autoHideMs);
        setHideTimer(timer);
      }
      
      toast({
        title: "🔓 Secret Revealed",
        description: autoHideMs > 0 ? `Will auto-hide in ${Math.ceil(autoHideMs / 1000)}s` : "Secret is now visible",
      });
    } catch (error) {
      if (error instanceof CryptoError) {
        switch (error.type) {
          case CryptoErrorType.VAULT_LOCKED:
            setError("Vault is locked - unlock to view secrets");
            break;
          case CryptoErrorType.INVALID_PASSPHRASE:
            setError("Invalid passphrase or corrupted data");
            break;
          default:
            setError("Failed to decrypt secret");
        }
      } else {
        setError("An unexpected error occurred");
      }
      
      toast({
        title: "❌ Decryption Failed",
        description: error instanceof Error ? error.message : "Failed to decrypt secret",
        variant: "destructive"
      });
    } finally {
      setIsDecrypting(false);
    }
  }, [encryptedBlob, plaintextValue, hasAnyData, isEncrypted, hasPlaintextData, autoHideMs, onReveal, toast]);

  const handleHide = useCallback(() => {
    setIsRevealed(false);
    setDecryptedValue(null);
    setError(null);
    setTimeUntilHide(0);
    
    if (hideTimer) {
      clearTimeout(hideTimer);
      setHideTimer(null);
    }
    
    onHide?.();
  }, [hideTimer, onHide]);

  const handleCopy = useCallback(async () => {
    if (!decryptedValue && !plaintextValue) return;
    
    const valueToCopy = decryptedValue || plaintextValue || '';
    
    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopied(true);
      onCopy?.();
      
      toast({
        title: "📋 Copied to Clipboard",
        description: "Secret value copied securely",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "❌ Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  }, [decryptedValue, plaintextValue, onCopy, toast]);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  if (!hasAnyData) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Input 
          value="" 
          placeholder={placeholder}
          readOnly 
          className="bg-muted/50"
        />
        {showEncryptionStatus && (
          <Badge variant="outline" className="text-xs">
            No Data
          </Badge>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type={isRevealed ? "text" : "password"}
              value={isRevealed ? (decryptedValue || plaintextValue || '') : '••••••••••••'}
              placeholder={placeholder}
              readOnly
              className={`pr-20 ${error ? 'border-destructive' : ''}`}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {showCopy && isRevealed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleCopy}
                      disabled={!decryptedValue && !plaintextValue}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={isRevealed ? handleHide : handleReveal}
                    disabled={isDecrypting}
                  >
                    {isDecrypting ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
                    ) : isRevealed ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRevealed ? 'Hide secret' : 'Reveal secret'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {showEncryptionStatus && (
            <div className="flex items-center gap-1">
              {isEncrypted ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>End-to-end encrypted with {encryptedBlob?.kdf === 'argon2id' ? 'Argon2id' : 'PBKDF2'}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Plaintext
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Stored as plaintext - consider encrypting</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        
        {/* Auto-hide timer */}
        {isRevealed && timeUntilHide > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Timer className="h-3 w-3" />
            <span>Auto-hide in {formatTime(timeUntilHide)}</span>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
