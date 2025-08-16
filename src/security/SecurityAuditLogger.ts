/**
 * Security Audit Logger - Comprehensive security event tracking
 * 
 * Tracks all security-related operations including encryption, decryption,
 * vault operations, and potential security threats for monitoring and compliance.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

import type { CryptoMetrics } from '@/crypto/types';
import { getCurrentUsername } from '@/integrations/supabase/client';

/**
 * Security event types for comprehensive tracking
 */
export type SecurityEventType = 
  // Vault operations
  | 'vault_unlock_attempt'
  | 'vault_unlock_success'
  | 'vault_unlock_failure'
  | 'vault_lock'
  | 'vault_auto_lock'
  | 'vault_passphrase_change'
  
  // Encryption operations
  | 'credential_encrypt'
  | 'credential_decrypt'
  | 'credential_decrypt_failure'
  | 'bulk_encryption'
  | 'migration_start'
  | 'migration_complete'
  | 'migration_failure'
  
  // Access operations
  | 'credential_view'
  | 'credential_copy'
  | 'credential_export'
  | 'credential_create'
  | 'credential_update'
  | 'credential_delete'
  
  // Security threats
  | 'multiple_failed_attempts'
  | 'suspicious_activity'
  | 'csp_violation'
  | 'xss_attempt'
  | 'injection_attempt'
  
  // System events
  | 'session_start'
  | 'session_end'
  | 'configuration_change'
  | 'security_policy_violation';

/**
 * Security event severity levels
 */
export type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Security event log entry
 */
export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId: string;
  sessionId: string;
  
  // Event details
  message: string;
  details?: Record<string, any>;
  
  // Context information
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  
  // Performance metrics
  duration?: number;
  
  // Related entities
  credentialId?: string;
  resourceId?: string;
  
  // Security metadata
  riskScore?: number;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Security metrics for monitoring
 */
export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  failedAttempts: number;
  successfulOperations: number;
  averageResponseTime: number;
  riskScore: number;
  lastActivity: Date;
}

/**
 * Security audit logger class
 */
class SecurityAuditLogger {
  private events: SecurityEvent[] = [];
  private sessionId: string;
  private maxEvents: number = 1000; // Keep last 1000 events in memory
  private failedAttempts: Map<string, number> = new Map();
  private suspiciousActivityThreshold = 5;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  /**
   * Get current user ID dynamically
   */
  private getCurrentUserId(): string {
    return getCurrentUsername() || 'self-hosted-user';
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the logger with session tracking
   */
  private initializeLogger(): void {
    this.logEvent('session_start', 'info', 'Security audit session started');
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logEvent('session_end', 'info', 'Session paused (page hidden)');
      } else {
        this.logEvent('session_start', 'info', 'Session resumed (page visible)');
      }
    });

    // Track beforeunload for session end
    window.addEventListener('beforeunload', () => {
      this.logEvent('session_end', 'info', 'Session ended (page unload)');
    });
  }

  /**
   * Log a security event
   */
  logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    details?: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      severity,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      message,
      details,
      userAgent: navigator.userAgent,
      location: window.location.href,
    };

    // Calculate risk score
    event.riskScore = this.calculateRiskScore(event);
    event.threatLevel = this.determineThreatLevel(event.riskScore);

    // Add to events array
    this.events.push(event);

    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Handle special event types
    this.handleSpecialEvents(event);

    // Log to console in development (only warnings and above to reduce noise)
    if (import.meta.env.DEV && severity !== 'info') {
      console.log(`[Security Audit] ${severity.toUpperCase()}: ${message}`, event);
    }

    // In production, you might want to send critical events to a monitoring service
    if (import.meta.env.PROD && (severity === 'error' || severity === 'critical')) {
      this.sendToMonitoringService(event);
    }
  }

  /**
   * Calculate risk score for an event (0-100)
   */
  private calculateRiskScore(event: SecurityEvent): number {
    let score = 0;

    // Base scores by event type
    const typeScores: Partial<Record<SecurityEventType, number>> = {
      'vault_unlock_failure': 30,
      'credential_decrypt_failure': 25,
      'multiple_failed_attempts': 60,
      'suspicious_activity': 70,
      'csp_violation': 40,
      'xss_attempt': 80,
      'injection_attempt': 90,
      'vault_unlock_success': 5,
      'credential_decrypt': 10,
      'credential_view': 5,
    };

    score += typeScores[event.type] || 0;

    // Severity multipliers
    const severityMultipliers: Record<SecuritySeverity, number> = {
      'info': 1,
      'warning': 1.5,
      'error': 2,
      'critical': 3,
    };

    score *= severityMultipliers[event.severity];

    // Time-based factors (more recent = higher risk)
    const hoursSinceEvent = (Date.now() - event.timestamp.getTime()) / (1000 * 60 * 60);
    if (hoursSinceEvent < 1) score *= 1.5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determine threat level based on risk score
   */
  private determineThreatLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  /**
   * Handle special event types that require additional processing
   */
  private handleSpecialEvents(event: SecurityEvent): void {
    switch (event.type) {
      case 'vault_unlock_failure':
        this.trackFailedAttempt('vault_unlock');
        break;
      case 'credential_decrypt_failure':
        this.trackFailedAttempt('decrypt');
        break;
      case 'csp_violation':
        this.handleCSPViolation(event);
        break;
    }
  }

  /**
   * Track failed attempts and detect suspicious activity
   */
  private trackFailedAttempt(operation: string): void {
    const key = `${operation}_${this.sessionId}`;
    const attempts = (this.failedAttempts.get(key) || 0) + 1;
    this.failedAttempts.set(key, attempts);

    if (attempts >= this.suspiciousActivityThreshold) {
      this.logEvent(
        'multiple_failed_attempts',
        'error',
        `Multiple failed ${operation} attempts detected`,
        { operation, attempts, threshold: this.suspiciousActivityThreshold }
      );
    }
  }

  /**
   * Handle CSP violations
   */
  private handleCSPViolation(event: SecurityEvent): void {
    // CSP violations might indicate XSS attempts
    const details = event.details;
    if (details?.violatedDirective?.includes('script-src')) {
      this.logEvent(
        'xss_attempt',
        'critical',
        'Potential XSS attempt detected via CSP violation',
        details
      );
    }
  }

  /**
   * Send critical events to monitoring service (placeholder)
   */
  private sendToMonitoringService(event: SecurityEvent): void {
    // In a real implementation, you would send this to your monitoring service
    // Example: Sentry, DataDog, CloudWatch, etc.
    console.warn('[Security Alert] Critical security event:', event);
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    const now = Date.now();
    const recentEvents = this.events.filter(e => 
      now - e.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<SecurityEventType, number>);

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<SecuritySeverity, number>);

    const failedAttempts = recentEvents.filter(e => 
      e.type.includes('failure') || e.type.includes('failed')
    ).length;

    const successfulOperations = recentEvents.filter(e => 
      e.type.includes('success') || e.severity === 'info'
    ).length;

    const durations = recentEvents
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);
    const averageResponseTime = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const riskScores = recentEvents.map(e => e.riskScore || 0);
    const riskScore = riskScores.length > 0
      ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
      : 0;

    const lastActivity = recentEvents.length > 0 
      ? recentEvents[recentEvents.length - 1].timestamp
      : new Date();

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      failedAttempts,
      successfulOperations,
      averageResponseTime,
      riskScore,
      lastActivity,
    };
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return this.events.filter(e => e.type === type);
  }

  /**
   * Get high-risk events
   */
  getHighRiskEvents(): SecurityEvent[] {
    return this.events.filter(e => (e.riskScore || 0) >= 60);
  }

  /**
   * Clear old events (for privacy)
   */
  clearOldEvents(olderThanDays: number = 7): void {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => e.timestamp.getTime() > cutoffTime);
  }

  /**
   * Export events for analysis
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Set user ID (for multi-user environments)
   * Note: This method is kept for compatibility but userId is now retrieved dynamically
   */
  setUserId(userId: string): void {
    // Update localStorage directly since we now use dynamic retrieval
    localStorage.setItem('keyper-username', userId);
    this.logEvent('configuration_change', 'info', 'User ID updated', { userId });
  }
}

// Export singleton instance
export const securityLogger = new SecurityAuditLogger();

// Convenience functions for common operations
export const logVaultUnlock = (success: boolean, duration?: number) => {
  securityLogger.logEvent(
    success ? 'vault_unlock_success' : 'vault_unlock_failure',
    success ? 'info' : 'warning',
    success ? 'Vault unlocked successfully' : 'Failed to unlock vault',
    { duration }
  );
};

export const logCredentialAccess = (credentialId: string, operation: 'view' | 'copy' | 'decrypt') => {
  securityLogger.logEvent(
    `credential_${operation}` as SecurityEventType,
    'info',
    `Credential ${operation} operation`,
    { credentialId }
  );
};

export const logEncryptionOperation = (operation: 'encrypt' | 'decrypt', success: boolean, duration?: number) => {
  securityLogger.logEvent(
    `credential_${operation}${success ? '' : '_failure'}` as SecurityEventType,
    success ? 'info' : 'error',
    `Credential ${operation} ${success ? 'successful' : 'failed'}`,
    { duration }
  );
};

export const logSecurityThreat = (type: 'xss' | 'injection' | 'csp_violation', details: any) => {
  securityLogger.logEvent(
    `${type}_attempt` as SecurityEventType,
    'critical',
    `Security threat detected: ${type}`,
    details
  );
};

export default securityLogger;
