import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase, getSupabaseCredentials, clearSupabaseCredentials } from '@/integrations/supabase/client';
import { RefreshCw, Trash2, Database, Check, X } from 'lucide-react';

type Config = {
  'keyper-supabase-url': string | null;
  'keyper-supabase-key': string | null;
  'keyper-username': string | null;
  'keyper-admin-user': string | null;
};

export default function ResetKeyper() {
  const [config, setConfig] = useState<Config>({
    'keyper-supabase-url': null,
    'keyper-supabase-key': null,
    'keyper-username': null,
    'keyper-admin-user': null,
  });
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState<{ vault_config?: string; credentials?: string }>({});
  const [clearing, setClearing] = useState(false);

  const refreshConfig = () => {
    setConfig({
      'keyper-supabase-url': localStorage.getItem('keyper-supabase-url'),
      'keyper-supabase-key': localStorage.getItem('keyper-supabase-key'),
      'keyper-username': localStorage.getItem('keyper-username'),
      'keyper-admin-user': localStorage.getItem('keyper-admin-user'),
    });
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  const checkTables = async () => {
    setChecking(true);
    try {
      const vc = await supabase.from('vault_config').select('user_id').limit(1);
      setHealth(h => ({ ...h, vault_config: vc.error ? vc.error.message : 'ok' }));
    } catch (e: any) {
      setHealth(h => ({ ...h, vault_config: e?.message || 'error' }));
    }
    try {
      const cr = await supabase.from('credentials').select('id').limit(1);
      setHealth(h => ({ ...h, credentials: cr.error ? cr.error.message : 'ok' }));
    } catch (e: any) {
      setHealth(h => ({ ...h, credentials: e?.message || 'error' }));
    }
    setChecking(false);
  };

  const clearKeyperOnly = async () => {
    setClearing(true);
    try {
      // Clear all Keyper-related localStorage keys
      localStorage.removeItem('keyper-supabase-url');
      localStorage.removeItem('keyper-supabase-key');
      localStorage.removeItem('keyper-username');
      localStorage.removeItem('keyper-admin-user');
      
      // Clear vault-related storage that might be causing passphrase issues
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('keyper-') || key.includes('vault') || key.includes('crypto'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      clearSupabaseCredentials(); // double-tap helper
      refreshConfig();
      
      alert('Keyper configuration cleared! Navigate back to home to start fresh setup.');
    } finally {
      setClearing(false);
    }
  };

  const nukeOrigin = async () => {
    setClearing(true);
    try {
      localStorage.clear();
      if ('databases' in indexedDB) {
        const dbs = await (indexedDB as any).databases();
        for (const db of dbs) {
          if (db.name) indexedDB.deleteDatabase(db.name);
        }
      }
      if (('caches' in window)) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      refreshConfig();
    } finally {
      setClearing(false);
    }
  };

  const openSettings = () => {
    // Navigate to home which will show settings if no config
    window.location.href = '/';
  };

  const { supabaseUrl, supabaseKey, username } = getSupabaseCredentials();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-400" />
            Keyper – Reset / Diagnostics
          </CardTitle>
          <CardDescription>
            Same-origin utility to fix stuck config and verify required tables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-sm font-medium mb-2">Current config (this origin)</h3>
            <div className="text-xs bg-muted/50 rounded-md p-3 font-mono break-all">
              <div>supabaseUrl: {supabaseUrl || <em>not set</em>}</div>
              <div>supabaseKey: {supabaseKey ? '••••••' : <em>not set</em>}</div>
              <div>username: {username || <em>not set</em>}</div>
              <Separator className="my-2" />
              <pre className="whitespace-pre-wrap">
{JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Health checks</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={checkTables} disabled={checking}>
                {checking ? 'Checking…' : 'Check required tables'}
              </Button>
              {health.vault_config && (
                <Badge variant={health.vault_config === 'ok' ? 'default' : 'destructive'}>
                  vault_config: {health.vault_config === 'ok' ? <><Check className="h-3 w-3 mr-1" />ok</> : <><X className="h-3 w-3 mr-1" />{health.vault_config}</>}
                </Badge>
              )}
              {health.credentials && (
                <Badge variant={health.credentials === 'ok' ? 'default' : 'destructive'}>
                  credentials: {health.credentials === 'ok' ? <><Check className="h-3 w-3 mr-1" />ok</> : <><X className="h-3 w-3 mr-1" />{health.credentials}</>}
                </Badge>
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={openSettings}>
                <Database className="h-4 w-4 mr-2" />
                Open Settings
              </Button>
              <Button variant="outline" onClick={clearKeyperOnly} disabled={clearing}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Keyper config keys
              </Button>
              <Button variant="destructive" onClick={nukeOrigin} disabled={clearing}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear ALL site data (origin)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use “Clear Keyper config keys” to force the DB setup page again. Use the destructive action only if needed.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
