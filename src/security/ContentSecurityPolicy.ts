/**
 * Content Security Policy (CSP) Configuration
 * 
 * Implements comprehensive CSP headers to protect against XSS attacks,
 * code injection, and other web security vulnerabilities.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

/**
 * CSP directive configuration for Keyper
 */
export interface CSPConfig {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'child-src': string[];
  'worker-src': string[];
  'frame-ancestors': string[];
  'form-action': string[];
  'base-uri': string[];
  'manifest-src': string[];
}

/**
 * Production CSP configuration - Most restrictive
 */
export const PRODUCTION_CSP: CSPConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in production builds
    "'unsafe-eval'",   // Required for some React/Vite functionality
    // Note: argon2-browser bundled build doesn't need CDN access
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    "https://fonts.googleapis.com",
  ],
  'img-src': [
    "'self'",
    "data:", // For base64 encoded images
    "blob:", // For generated images
    "https:", // Allow HTTPS images
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com",
    "data:", // For base64 encoded fonts
  ],
  'connect-src': [
    "'self'",
    "https://*.supabase.co", // Supabase API endpoints
    "wss://*.supabase.co",  // Supabase WebSocket connections
    "https://api.supabase.io", // Supabase management API
  ],
  'media-src': ["'self'"],
  'object-src': ["'none'"], // Prevent Flash, Java, etc.
  'child-src': ["'self'"],
  'worker-src': [
    "'self'",
    "blob:", // For Web Workers
  ],
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
};

/**
 * Development CSP configuration - More permissive for development
 */
export const DEVELOPMENT_CSP: CSPConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'", // Required for Vite HMR
    "http://localhost:*", // Vite dev server
    "ws://localhost:*",   // Vite HMR WebSocket
    // Note: argon2-browser bundled build doesn't need CDN access
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    "http://localhost:*",
    "https://fonts.googleapis.com",
  ],
  'img-src': [
    "'self'",
    "data:",
    "blob:",
    "http://localhost:*",
    "https:",
  ],
  'font-src': [
    "'self'",
    "http://localhost:*",
    "https://fonts.gstatic.com",
    "data:",
  ],
  'connect-src': [
    "'self'",
    "http://localhost:*",
    "ws://localhost:*",
    "wss://localhost:*",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.supabase.io",
  ],
  'media-src': ["'self'", "http://localhost:*"],
  'object-src': ["'none'"],
  'child-src': ["'self'", "http://localhost:*"],
  'worker-src': [
    "'self'",
    "blob:",
    "http://localhost:*",
  ],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'", "http://localhost:*"],
};

/**
 * Convert CSP config object to CSP header string
 */
export function buildCSPHeader(config: CSPConfig): string {
  return Object.entries(config)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Get appropriate CSP configuration based on environment
 */
export function getCSPConfig(): CSPConfig {
  const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  return isDevelopment ? DEVELOPMENT_CSP : PRODUCTION_CSP;
}

/**
 * Get CSP header string for current environment
 */
export function getCSPHeader(): string {
  return buildCSPHeader(getCSPConfig());
}

/**
 * Get CSP header string for meta tags (excludes directives that can't be set via meta)
 */
export function getCSPMetaHeader(): string {
  const config = getCSPConfig();

  // Remove directives that can't be set via meta tags
  const metaConfig = { ...config };
  delete metaConfig['frame-ancestors'];

  return buildCSPHeader(metaConfig);
}

/**
 * Additional security headers for comprehensive protection
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': getCSPHeader(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS filtering
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Force HTTPS (if served over HTTPS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', '),
  
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/**
 * Apply security headers to HTML document (for client-side applications)
 */
export function applySecurityHeaders(): void {
  // Add CSP meta tag if not already present
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = getCSPMetaHeader();
    document.head.appendChild(cspMeta);
  }

  // Add other security meta tags (excluding those that can only be set via HTTP headers)
  const securityMetas = [
    { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
    { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
    // Note: X-Frame-Options can only be set via HTTP headers, not meta tags
    { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
  ];

  securityMetas.forEach(({ httpEquiv, content }) => {
    if (!document.querySelector(`meta[http-equiv="${httpEquiv}"]`)) {
      const meta = document.createElement('meta');
      meta.httpEquiv = httpEquiv;
      meta.content = content;
      document.head.appendChild(meta);
    }
  });
}

/**
 * Validate current CSP configuration
 */
export function validateCSP(): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const config = getCSPConfig();
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for unsafe directives
  if (config['script-src'].includes("'unsafe-inline'")) {
    warnings.push("'unsafe-inline' in script-src reduces XSS protection");
    recommendations.push("Consider using nonces or hashes instead of 'unsafe-inline'");
  }

  if (config['script-src'].includes("'unsafe-eval'")) {
    warnings.push("'unsafe-eval' in script-src allows code evaluation");
    recommendations.push("Avoid 'unsafe-eval' if possible, use alternatives for dynamic code");
  }

  // Check for overly permissive sources
  if (config['default-src'].includes('*')) {
    warnings.push("Wildcard (*) in default-src is overly permissive");
    recommendations.push("Specify explicit sources instead of using wildcards");
  }

  // Check for missing important directives
  if (config['object-src'][0] !== "'none'") {
    warnings.push("object-src should be set to 'none' to prevent plugin execution");
    recommendations.push("Set object-src to 'none' unless plugins are required");
  }

  if (config['frame-ancestors'][0] !== "'none'") {
    warnings.push("frame-ancestors should be restrictive to prevent clickjacking");
    recommendations.push("Consider setting frame-ancestors to 'none' or specific origins");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations,
  };
}

/**
 * CSP violation reporting (for development and monitoring)
 */
export function setupCSPReporting(): void {
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      timestamp: new Date().toISOString(),
    };

    console.warn('CSP Violation:', violation);

    // In production, you might want to send this to a logging service
    if (import.meta.env.PROD) {
      // Example: Send to logging service
      // logSecurityViolation('csp_violation', violation);
    }
  });
}

/**
 * Initialize security headers and CSP
 */
export function initializeSecurity(): void {
  // Apply security headers
  applySecurityHeaders();
  
  // Setup CSP violation reporting
  setupCSPReporting();
  
  // Validate CSP configuration in development
  if (import.meta.env.DEV) {
    const validation = validateCSP();
    if (!validation.isValid) {
      console.warn('CSP Configuration Issues:', validation.warnings);
      console.info('CSP Recommendations:', validation.recommendations);
    }
  }
}
