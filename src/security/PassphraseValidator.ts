/**
 * Advanced Passphrase Strength Validation
 * 
 * Comprehensive passphrase analysis including entropy calculation,
 * pattern detection, dictionary checks, and security recommendations.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

/**
 * Passphrase strength score (0-100)
 */
export type PassphraseScore = number;

/**
 * Passphrase strength levels
 */
export type PassphraseStrength = 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

/**
 * Passphrase analysis result
 */
export interface PassphraseAnalysis {
  score: PassphraseScore;
  strength: PassphraseStrength;
  entropy: number;
  crackTime: string;
  feedback: string[];
  warnings: string[];
  recommendations: string[];
  patterns: string[];
  isAcceptable: boolean;
  meetsMinimumRequirements: boolean;
}

/**
 * Passphrase requirements configuration
 */
export interface PassphraseRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minUniqueChars: number;
  maxRepeatingChars: number;
  forbiddenPatterns: string[];
  forbiddenWords: string[];
}

/**
 * Default passphrase requirements for Keyper
 */
export const DEFAULT_REQUIREMENTS: PassphraseRequirements = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minUniqueChars: 8,
  maxRepeatingChars: 3,
  forbiddenPatterns: [
    'password',
    'keyper',
    '123456',
    'qwerty',
    'admin',
    'login',
    'secret',
    'master',
  ],
  forbiddenWords: [
    'password',
    'passphrase',
    'keyper',
    'credential',
    'secret',
    'admin',
    'user',
    'login',
    'master',
    'key',
  ],
};

/**
 * Common weak patterns to detect
 */
const WEAK_PATTERNS = [
  /(.)\1{2,}/g,           // Repeating characters (aaa, 111)
  /012|123|234|345|456|567|678|789/g, // Sequential numbers
  /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/gi, // Sequential letters
  /qwer|wert|erty|rtyu|tyui|yuio|uiop|asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm/gi, // Keyboard patterns
  /\d{4,}/g,              // Long number sequences
  /[a-z]{4,}/gi,          // Long letter sequences
];

/**
 * Calculate character set size for entropy calculation
 */
function getCharacterSetSize(passphrase: string): number {
  let size = 0;
  
  if (/[a-z]/.test(passphrase)) size += 26;      // Lowercase
  if (/[A-Z]/.test(passphrase)) size += 26;      // Uppercase
  if (/[0-9]/.test(passphrase)) size += 10;      // Numbers
  if (/[^a-zA-Z0-9]/.test(passphrase)) size += 32; // Special characters (estimate)
  
  return size;
}

/**
 * Calculate passphrase entropy in bits
 */
function calculateEntropy(passphrase: string): number {
  const charSetSize = getCharacterSetSize(passphrase);
  const length = passphrase.length;
  
  // Basic entropy: log2(charSetSize^length)
  let entropy = length * Math.log2(charSetSize);
  
  // Reduce entropy for patterns and repetition
  const uniqueChars = new Set(passphrase).size;
  const repetitionPenalty = 1 - (length - uniqueChars) / length;
  entropy *= repetitionPenalty;
  
  // Reduce entropy for common patterns
  WEAK_PATTERNS.forEach(pattern => {
    const matches = passphrase.match(pattern);
    if (matches) {
      entropy *= 0.8; // 20% penalty per pattern type
    }
  });
  
  return Math.max(0, entropy);
}

/**
 * Estimate crack time based on entropy
 */
function estimateCrackTime(entropy: number): string {
  // Assume 1 billion guesses per second (modern hardware)
  const guessesPerSecond = 1e9;
  const totalGuesses = Math.pow(2, entropy - 1); // Average case
  const seconds = totalGuesses / guessesPerSecond;
  
  if (seconds < 1) return 'Instant';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
  return 'Centuries';
}

/**
 * Detect weak patterns in passphrase
 */
function detectPatterns(passphrase: string): string[] {
  const patterns: string[] = [];
  
  // Check for repeating characters
  if (/(.)\1{2,}/.test(passphrase)) {
    patterns.push('Contains repeating characters');
  }
  
  // Check for sequential patterns
  if (/012|123|234|345|456|567|678|789/.test(passphrase)) {
    patterns.push('Contains sequential numbers');
  }
  
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(passphrase)) {
    patterns.push('Contains sequential letters');
  }
  
  // Check for keyboard patterns
  if (/qwer|wert|erty|rtyu|tyui|yuio|uiop|asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm/i.test(passphrase)) {
    patterns.push('Contains keyboard patterns');
  }
  
  // Check for common substitutions
  if (/[@4][sS5][sS5][wW][0o][rR][dD]/.test(passphrase)) {
    patterns.push('Contains common character substitutions');
  }
  
  return patterns;
}

/**
 * Check passphrase against requirements
 */
function checkRequirements(passphrase: string, requirements: PassphraseRequirements): {
  meets: boolean;
  failures: string[];
} {
  const failures: string[] = [];
  
  // Length checks
  if (passphrase.length < requirements.minLength) {
    failures.push(`Must be at least ${requirements.minLength} characters long`);
  }
  if (passphrase.length > requirements.maxLength) {
    failures.push(`Must be no more than ${requirements.maxLength} characters long`);
  }
  
  // Character type requirements
  if (requirements.requireUppercase && !/[A-Z]/.test(passphrase)) {
    failures.push('Must contain at least one uppercase letter');
  }
  if (requirements.requireLowercase && !/[a-z]/.test(passphrase)) {
    failures.push('Must contain at least one lowercase letter');
  }
  if (requirements.requireNumbers && !/[0-9]/.test(passphrase)) {
    failures.push('Must contain at least one number');
  }
  if (requirements.requireSpecialChars && !/[^a-zA-Z0-9]/.test(passphrase)) {
    failures.push('Must contain at least one special character');
  }
  
  // Unique characters
  const uniqueChars = new Set(passphrase).size;
  if (uniqueChars < requirements.minUniqueChars) {
    failures.push(`Must contain at least ${requirements.minUniqueChars} unique characters`);
  }
  
  // Repeating characters
  const maxRepeating = Math.max(...Array.from(passphrase).map(char => 
    (passphrase.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  ));
  if (maxRepeating > requirements.maxRepeatingChars) {
    failures.push(`No character should repeat more than ${requirements.maxRepeatingChars} times`);
  }
  
  // Forbidden patterns
  const lowerPassphrase = passphrase.toLowerCase();
  requirements.forbiddenPatterns.forEach(pattern => {
    if (lowerPassphrase.includes(pattern.toLowerCase())) {
      failures.push(`Must not contain "${pattern}"`);
    }
  });
  
  // Forbidden words
  requirements.forbiddenWords.forEach(word => {
    if (lowerPassphrase.includes(word.toLowerCase())) {
      failures.push(`Must not contain the word "${word}"`);
    }
  });
  
  return {
    meets: failures.length === 0,
    failures,
  };
}

/**
 * Generate feedback and recommendations
 */
function generateFeedback(passphrase: string, entropy: number, patterns: string[]): {
  feedback: string[];
  recommendations: string[];
  warnings: string[];
} {
  const feedback: string[] = [];
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  // Length feedback
  if (passphrase.length < 8) {
    warnings.push('Passphrase is too short');
    recommendations.push('Use at least 12 characters for better security');
  } else if (passphrase.length < 12) {
    feedback.push('Consider using a longer passphrase');
    recommendations.push('Aim for 15+ characters for optimal security');
  } else {
    feedback.push('Good length');
  }
  
  // Character variety feedback
  const hasUpper = /[A-Z]/.test(passphrase);
  const hasLower = /[a-z]/.test(passphrase);
  const hasNumbers = /[0-9]/.test(passphrase);
  const hasSpecial = /[^a-zA-Z0-9]/.test(passphrase);
  
  const varietyCount = [hasUpper, hasLower, hasNumbers, hasSpecial].filter(Boolean).length;
  
  if (varietyCount < 3) {
    warnings.push('Limited character variety');
    recommendations.push('Mix uppercase, lowercase, numbers, and special characters');
  } else if (varietyCount === 3) {
    feedback.push('Good character variety');
  } else {
    feedback.push('Excellent character variety');
  }
  
  // Entropy feedback
  if (entropy < 40) {
    warnings.push('Low entropy - easily guessable');
    recommendations.push('Avoid common words and patterns');
  } else if (entropy < 60) {
    feedback.push('Moderate entropy');
    recommendations.push('Consider adding more randomness');
  } else if (entropy < 80) {
    feedback.push('Good entropy');
  } else {
    feedback.push('Excellent entropy');
  }
  
  // Pattern warnings
  if (patterns.length > 0) {
    warnings.push('Contains predictable patterns');
    recommendations.push('Avoid keyboard patterns, sequences, and repetition');
  }
  
  // General recommendations
  if (entropy < 70) {
    recommendations.push('Consider using a passphrase with random words');
    recommendations.push('Use a password manager to generate strong passphrases');
  }
  
  return { feedback, recommendations, warnings };
}

/**
 * Determine strength level from score
 */
function getStrengthLevel(score: PassphraseScore): PassphraseStrength {
  if (score >= 90) return 'very-strong';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'weak';
  return 'very-weak';
}

/**
 * Calculate overall passphrase score (0-100)
 */
function calculateScore(passphrase: string, entropy: number, patterns: string[], requirementsMet: boolean): PassphraseScore {
  let score = 0;
  
  // Base score from entropy (0-60 points)
  score += Math.min(60, entropy * 0.75);
  
  // Length bonus (0-15 points)
  const lengthBonus = Math.min(15, (passphrase.length - 8) * 1.5);
  score += Math.max(0, lengthBonus);
  
  // Character variety bonus (0-15 points)
  const hasUpper = /[A-Z]/.test(passphrase);
  const hasLower = /[a-z]/.test(passphrase);
  const hasNumbers = /[0-9]/.test(passphrase);
  const hasSpecial = /[^a-zA-Z0-9]/.test(passphrase);
  const varietyCount = [hasUpper, hasLower, hasNumbers, hasSpecial].filter(Boolean).length;
  score += varietyCount * 3.75;
  
  // Unique characters bonus (0-10 points)
  const uniqueChars = new Set(passphrase).size;
  const uniqueBonus = Math.min(10, (uniqueChars / passphrase.length) * 10);
  score += uniqueBonus;
  
  // Pattern penalties
  score -= patterns.length * 10;
  
  // Requirements penalty
  if (!requirementsMet) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze passphrase strength comprehensively
 */
export function analyzePassphrase(
  passphrase: string, 
  requirements: PassphraseRequirements = DEFAULT_REQUIREMENTS
): PassphraseAnalysis {
  // Basic validation
  if (!passphrase) {
    return {
      score: 0,
      strength: 'very-weak',
      entropy: 0,
      crackTime: 'Instant',
      feedback: [],
      warnings: ['Passphrase is required'],
      recommendations: ['Enter a passphrase'],
      patterns: [],
      isAcceptable: false,
      meetsMinimumRequirements: false,
    };
  }
  
  // Calculate entropy
  const entropy = calculateEntropy(passphrase);
  
  // Detect patterns
  const patterns = detectPatterns(passphrase);
  
  // Check requirements
  const requirementsCheck = checkRequirements(passphrase, requirements);
  
  // Calculate score
  const score = calculateScore(passphrase, entropy, patterns, requirementsCheck.meets);
  
  // Generate feedback
  const { feedback, recommendations, warnings } = generateFeedback(passphrase, entropy, patterns);
  
  // Add requirement failures to warnings
  warnings.push(...requirementsCheck.failures);
  
  // Determine strength level
  const strength = getStrengthLevel(score);
  
  // Estimate crack time
  const crackTime = estimateCrackTime(entropy);
  
  // Determine acceptability (minimum score of 60 and meets requirements)
  const isAcceptable = score >= 60 && requirementsCheck.meets;
  
  return {
    score,
    strength,
    entropy,
    crackTime,
    feedback,
    warnings,
    recommendations,
    patterns,
    isAcceptable,
    meetsMinimumRequirements: requirementsCheck.meets,
  };
}

/**
 * Get strength color for UI display
 */
export function getStrengthColor(strength: PassphraseStrength): string {
  const colors = {
    'very-weak': '#ef4444',   // red-500
    'weak': '#f97316',        // orange-500
    'fair': '#eab308',        // yellow-500
    'good': '#3b82f6',        // blue-500
    'strong': '#10b981',      // emerald-500
    'very-strong': '#059669', // emerald-600
  };
  
  return colors[strength];
}

/**
 * Generate a secure passphrase suggestion
 */
export function generateSecurePassphrase(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  let passphrase = '';
  
  // Ensure at least one character from each category
  passphrase += uppercase[Math.floor(Math.random() * uppercase.length)];
  passphrase += lowercase[Math.floor(Math.random() * lowercase.length)];
  passphrase += numbers[Math.floor(Math.random() * numbers.length)];
  passphrase += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    passphrase += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the passphrase
  return passphrase.split('').sort(() => Math.random() - 0.5).join('');
}

export default {
  analyzePassphrase,
  getStrengthColor,
  generateSecurePassphrase,
  DEFAULT_REQUIREMENTS,
};
