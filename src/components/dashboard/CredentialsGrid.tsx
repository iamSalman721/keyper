import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Key, 
  User, 
  Shield, 
  Code, 
  Award,
  Clock,
  Eye
} from 'lucide-react';
import { Credential } from '../SelfHostedDashboard';

interface CredentialsGridProps {
  credentials: Credential[];
  loading: boolean;
  onCredentialClick: (credential: Credential) => void;
}

export const CredentialsGrid = ({ 
  credentials, 
  loading, 
  onCredentialClick 
}: CredentialsGridProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api_key':
        return <Key className="h-4 w-4" />;
      case 'login':
        return <User className="h-4 w-4" />;
      case 'secret':
        return <Shield className="h-4 w-4" />;
      case 'token':
        return <Code className="h-4 w-4" />;
      case 'certificate':
        return <Award className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <Skeleton className="h-4 w-3/4 bg-gray-700" />
              <Skeleton className="h-3 w-1/2 bg-gray-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full bg-gray-700 mb-2" />
              <Skeleton className="h-3 w-2/3 bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No credentials found</h3>
        <p className="text-gray-500">Add your first credential to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {credentials.map((credential) => (
        <Card 
          key={credential.id}
          className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer group"
          onClick={() => onCredentialClick(credential)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getTypeIcon(credential.credential_type)}
                <CardTitle className="text-lg text-white group-hover:text-cyan-400 transition-colors">
                  {credential.title}
                </CardTitle>
              </div>
              <Badge className={getPriorityColor(credential.priority)}>
                {credential.priority}
              </Badge>
            </div>
            {credential.description && (
              <p className="text-sm text-gray-400 line-clamp-2">
                {credential.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-300 capitalize">
                {credential.credential_type.replace('_', ' ')}
              </span>
            </div>

            {credential.category && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Category</span>
                <span className="text-gray-300">{credential.category}</span>
              </div>
            )}

            {credential.expires_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Expires
                </span>
                <span className="text-gray-300">
                  {formatDate(credential.expires_at)}
                </span>
              </div>
            )}

            {credential.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {credential.tags.slice(0, 3).map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs bg-cyan-900/50 text-cyan-300 border-cyan-700"
                  >
                    {tag}
                  </Badge>
                ))}
                {credential.tags.length > 3 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-gray-700 text-gray-300"
                  >
                    +{credential.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-500">
                Updated {formatDate(credential.updated_at)}
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
