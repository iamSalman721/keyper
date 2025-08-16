
import React from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Plus, Shield, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  user: User;
  onAddCredential: () => void;
  onRefresh: () => void;
}

export const DashboardHeader = ({ user, onAddCredential, onRefresh }: DashboardHeaderProps) => {

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-1 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
              <img
                src="/logo.png"
                alt="Keyper Logo"
                className="h-11 w-11 rounded-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Keyper</h1>
              <p className="text-sm text-gray-400">Secure credential vault</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">Self-Hosted Keyper</span>
            </div>

            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              onClick={onAddCredential}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
