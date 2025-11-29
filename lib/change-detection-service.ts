import { CreateChangeInput } from './enhancement-service';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface FieldDiff {
  field_name: string;
  old_value: any;
  new_value: any;
  change_type: 'addition' | 'update' | 'correction' | 'enhancement';
  confidence_score: number;
  source: string;
  source_url?: string;
  notes?: string;
  validation_errors?: string[];
}

export interface ChangeDetectionOptions {
  confidenceThreshold: number;
  includeMinorChanges: boolean;
  validateChanges: boolean;
  skipEmptyFields: boolean;
  prioritiseHighValue: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// FIELD VALIDATION RULES
// =============================================================================

const FIELD_VALIDATION_RULES: Record<string, (value: any) => ValidationResult> = {
  name: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, errors: ['Name must be a non-empty string'], warnings: [] };
    }
    if (value.length < 2) {
      return { isValid: false, errors: ['Name must be at least 2 characters'], warnings: [] };
    }
    if (value.length > 200) {
      return { isValid: false, errors: ['Name must be less than 200 characters'], warnings: [] };
    }
    return { isValid: true, errors: [], warnings: [] };
  },

  brand: (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, errors: ['Brand must be a non-empty string'], warnings: [] };
    }
    if (value.length < 2) {
      return { isValid: false, errors: ['Brand must be at least 2 characters'], warnings: [] };
    }
    return { isValid: true, errors: [], warnings: [] };
  },

  concentration: (value) => {
    const validConcentrations = [
      'Parfum', 'Extrait de Parfum', 'Eau de Parfum', 'Eau de Toilette',
      'Eau de Cologne', 'Eau Fraiche', 'Aftershave', 'Hair Mist'
    ];

    if (!value) return { isValid: true, errors: [], warnings: [] };

    if (typeof value !== 'string') {
      return { isValid: false, errors: ['Concentration must be a string'], warnings: [] };
    }

    if (!validConcentrations.includes(value)) {
      return {
        isValid: true,
        errors: [],
        warnings: [`Unknown concentration type: ${value}. Consider using: ${validConcentrations.join(', ')}`]
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  },

  gender: (value) => {
    const validGenders = ['male', 'female', 'unisex'];

    if (!value) return { isValid: true, errors: [], warnings: [] };

    if (typeof value !== 'string') {
      return { isValid: false, errors: ['Gender must be a string'], warnings: [] };
    }

    const lowerValue = value.toLowerCase();
    if (!validGenders.includes(lowerValue)) {
      return {
        isValid: false,
        errors: [`Gender must be one of: ${validGenders.join(', ')}`],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  },

  year_released: (value) => {
    if (!value) return { isValid: true, errors: [], warnings: [] };

    const year = Number(value);
    if (isNaN(year)) {
      return { isValid: false, errors: ['Year must be a number'], warnings: [] };
    }

    const currentYear = new Date().getFullYear();
    if (year < 1800 || year > currentYear + 2) {
      return {
        isValid: false,
        errors: [`Year must be between 1800 and ${currentYear + 2}`],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  },

  rating_value: (value) => {
    if (!value) return { isValid: true, errors: [], warnings: [] };

    const rating = Number(value);
    if (isNaN(rating)) {
      return { isValid: false, errors: ['Rating must be a number'], warnings: [] };
    }

    if (rating < 0 || rating > 5) {
      return { isValid: false, errors: ['Rating must be between 0 and 5'], warnings: [] };
    }

    return { isValid: true, errors: [], warnings: [] };
  },

  longevity_rating: (value) => {
    if (!value) return { isValid: true, errors: [], warnings: [] };

    const rating = Number(value);
    if (isNaN(rating)) {
      return { isValid: false, errors: ['Longevity rating must be a number'], warnings: [] };
    }

    if (rating < 0 || rating > 5) {
      return { isValid: false, errors: ['Longevity rating must be between 0 and 5'], warnings: [] };
    }

    return { isValid: true, errors: [], warnings: [] };
  },

  sillage_rating: (value) => {
    if (!value) return { isValid: true, errors: [], warnings: [] };

    const rating = Number(value);
    if (isNaN(rating)) {
      return { isValid: false, errors: ['Sillage rating must be a number'], warnings: [] };
    }

    if (rating < 0 || rating > 5) {
      return { isValid: false, errors: ['Sillage rating must be between 0 and 5'], warnings: [] };
    }

    return { isValid: true, errors: [], warnings: [] };
  },

  main_accords: (value) => {
    if (!value) return { isValid: true, errors: [], warnings: [] };

    if (!Array.isArray(value)) {
      return { isValid: false, errors: ['Main accords must be an array'], warnings: [] };
    }

    if (value.length > 10) {
      return {
        isValid: true,
        errors: [],
        warnings: ['More than 10 accords may be excessive']
      };
    }

    const invalidItems = value.filter(item => typeof item !== 'string' || item.trim().length === 0);
    if (invalidItems.length > 0) {
      return {
        isValid: false,
        errors: ['All accords must be non-empty strings'],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  },

  top_notes: (value) => {
    if (!value) return { isValid: true, errors: [], warnings: [] };
    return FIELD_VALIDATION_RULES.main_accords(value); // Same validation as accords
  },

  middle_notes: (value) => {
    if (!value) return { isValid: true, errors: [], warnings: [] };
    return FIELD_VALIDATION_RULES.main_accords(value); // Same validation as accords
  },

  base_notes: (value) => {
    if (!value) return { isValid: true, errors: [], warnings: [] };
    return FIELD_VALIDATION_RULES.main_accords(value); // Same validation as accords
  }
};

// =============================================================================
// CHANGE DETECTION SERVICE
// =============================================================================

export class ChangeDetectionService {

  // ===========================================================================
  // CORE DIFF DETECTION
  // ===========================================================================

  static detectChanges(
    originalData: Record<string, any>,
    newData: Record<string, any>,
    source: string,
    sourceUrl?: string,
    options: Partial<ChangeDetectionOptions> = {}
  ): FieldDiff[] {
    const opts: ChangeDetectionOptions = {
      confidenceThreshold: 0.5,
      includeMinorChanges: true,
      validateChanges: true,
      skipEmptyFields: false,
      prioritiseHighValue: true,
      ...options
    };

    const diffs: FieldDiff[] = [];

    // Get all fields from both objects
    const allFields = new Set([
      ...Object.keys(originalData),
      ...Object.keys(newData)
    ]);

    for (const fieldName of allFields) {
      const oldValue = originalData[fieldName];
      const newValue = newData[fieldName];

      // Skip if values are identical
      if (this.isIdentical(oldValue, newValue)) continue;

      // Skip empty new values if configured
      if (opts.skipEmptyFields && this.isEmpty(newValue)) continue;

      // Determine change type and confidence
      const changeType = this.determineChangeType(oldValue, newValue);
      const confidence = this.calculateConfidence(fieldName, oldValue, newValue, source);

      // Skip low confidence changes if below threshold
      if (confidence < opts.confidenceThreshold) continue;

      // Validate the new value
      const validation = opts.validateChanges
        ? this.validateField(fieldName, newValue)
        : { isValid: true, errors: [], warnings: [] };

      // Create diff
      const diff: FieldDiff = {
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        change_type: changeType,
        confidence_score: confidence,
        source,
        source_url: sourceUrl,
        notes: this.generateChangeNotes(fieldName, oldValue, newValue, changeType),
        validation_errors: validation.errors.length > 0 ? validation.errors : undefined
      };

      diffs.push(diff);
    }

    // Sort by priority and confidence
    return this.sortChangesByPriority(diffs, opts.prioritiseHighValue);
  }

  // ===========================================================================
  // CHANGE TYPE DETECTION
  // ===========================================================================

  private static determineChangeType(
    oldValue: any,
    newValue: any
  ): 'addition' | 'update' | 'correction' | 'enhancement' {
    const oldEmpty = this.isEmpty(oldValue);
    const newEmpty = this.isEmpty(newValue);

    // Addition: no old value, has new value
    if (oldEmpty && !newEmpty) {
      return 'addition';
    }

    // Update: both have values, different types or structures
    if (!oldEmpty && !newEmpty) {
      if (typeof oldValue !== typeof newValue) {
        return 'correction';
      }

      // Array enhancements (adding items)
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        if (newValue.length > oldValue.length) {
          return 'enhancement';
        }
        return 'update';
      }

      // String improvements
      if (typeof oldValue === 'string' && typeof newValue === 'string') {
        if (newValue.length > oldValue.length * 1.5) {
          return 'enhancement';
        }
        return 'update';
      }

      return 'update';
    }

    return 'update';
  }

  // ===========================================================================
  // CONFIDENCE SCORING
  // ===========================================================================

  private static calculateConfidence(
    fieldName: string,
    oldValue: any,
    newValue: any,
    source: string
  ): number {
    let baseConfidence = 0.7; // Base confidence

    // Adjust based on source reliability
    const sourceConfidence = this.getSourceConfidence(source);
    baseConfidence *= sourceConfidence;

    // Adjust based on field importance
    const fieldImportance = this.getFieldImportance(fieldName);
    baseConfidence *= fieldImportance;

    // Adjust based on change quality
    const qualityScore = this.assessChangeQuality(fieldName, oldValue, newValue);
    baseConfidence *= qualityScore;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, baseConfidence));
  }

  private static getSourceConfidence(source: string): number {
    const sourceReliability: Record<string, number> = {
      'fragrantica_scrape': 0.95,
      'brand_website': 0.9,
      'ai_gemini': 0.8,
      'ai_openai': 0.8,
      'ai_hybrid': 0.85,
      'manual_entry': 1.0
    };

    return sourceReliability[source] || 0.7;
  }

  private static getFieldImportance(fieldName: string): number {
    const fieldWeights: Record<string, number> = {
      // Critical fields
      'name': 1.0,
      'brand': 1.0,
      'concentration': 0.95,
      'family': 0.9,
      'gender': 0.9,

      // High-value fields
      'description': 0.85,
      'year_released': 0.8,
      'main_accords': 0.85,
      'top_notes': 0.8,
      'middle_notes': 0.8,
      'base_notes': 0.8,

      // Moderate importance
      'perfumers': 0.75,
      'rating_value': 0.7,
      'longevity_rating': 0.75,
      'sillage_rating': 0.75,

      // Lower importance
      'image_url': 0.6,
      'tags': 0.6,
      'price_range': 0.65
    };

    return fieldWeights[fieldName] || 0.7;
  }

  private static assessChangeQuality(fieldName: string, oldValue: any, newValue: any): number {
    // Empty to filled is generally good
    if (this.isEmpty(oldValue) && !this.isEmpty(newValue)) {
      return 1.1; // Boost confidence for additions
    }

    // String improvements
    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      const lengthRatio = newValue.length / oldValue.length;

      // Significant expansion is usually good
      if (lengthRatio > 2) return 1.1;

      // Minor changes might be corrections
      if (lengthRatio > 0.8 && lengthRatio < 1.2) return 1.0;

      // Dramatic reduction might be bad
      if (lengthRatio < 0.5) return 0.8;
    }

    // Array enhancements
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (newValue.length > oldValue.length) {
        return 1.1; // Adding items is good
      }
    }

    return 1.0; // Neutral
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private static validateField(fieldName: string, value: any): ValidationResult {
    const validator = FIELD_VALIDATION_RULES[fieldName];

    if (!validator) {
      // No specific validation for this field
      return { isValid: true, errors: [], warnings: [] };
    }

    return validator(value);
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  private static isIdentical(value1: any, value2: any): boolean {
    // Handle null/undefined
    if (value1 === value2) return true;
    if (value1 == null || value2 == null) return false;

    // Handle arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) return false;
      return value1.every((item, index) => this.isIdentical(item, value2[index]));
    }

    // Handle objects
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const keys1 = Object.keys(value1);
      const keys2 = Object.keys(value2);

      if (keys1.length !== keys2.length) return false;

      return keys1.every(key => this.isIdentical(value1[key], value2[key]));
    }

    // Handle strings (case-insensitive for some fields)
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.trim() === value2.trim();
    }

    return value1 === value2;
  }

  private static isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  private static generateChangeNotes(
    fieldName: string,
    oldValue: any,
    newValue: any,
    changeType: string
  ): string {
    const field = fieldName.replace(/_/g, ' ');

    switch (changeType) {
      case 'addition':
        return `Added ${field} information that was previously missing.`;
      case 'enhancement':
        if (Array.isArray(newValue) && Array.isArray(oldValue)) {
          const added = newValue.length - oldValue.length;
          return `Enhanced ${field} by adding ${added} additional item${added > 1 ? 's' : ''}.`;
        }
        return `Enhanced ${field} with more detailed information.`;
      case 'correction':
        return `Corrected ${field} data format or value.`;
      default:
        return `Updated ${field} information.`;
    }
  }

  private static sortChangesByPriority(diffs: FieldDiff[], prioritiseHighValue: boolean): FieldDiff[] {
    if (!prioritiseHighValue) {
      return diffs.sort((a, b) => b.confidence_score - a.confidence_score);
    }

    return diffs.sort((a, b) => {
      // First sort by field importance
      const aImportance = this.getFieldImportance(a.field_name);
      const bImportance = this.getFieldImportance(b.field_name);

      if (aImportance !== bImportance) {
        return bImportance - aImportance;
      }

      // Then by confidence
      return b.confidence_score - a.confidence_score;
    });
  }

  // ===========================================================================
  // PUBLIC UTILITY METHODS
  // ===========================================================================

  static createChangesFromDiffs(diffs: FieldDiff[]): CreateChangeInput[] {
    return diffs.map(diff => ({
      field_name: diff.field_name,
      old_value: diff.old_value,
      new_value: diff.new_value,
      change_type: diff.change_type,
      confidence_score: diff.confidence_score,
      source: diff.source,
      source_url: diff.source_url,
      notes: diff.notes
    }));
  }

  static filterHighConfidenceChanges(diffs: FieldDiff[], threshold: number = 0.8): FieldDiff[] {
    return diffs.filter(diff => diff.confidence_score >= threshold);
  }

  static groupChangesByType(diffs: FieldDiff[]): Record<string, FieldDiff[]> {
    return diffs.reduce((groups, diff) => {
      const type = diff.change_type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(diff);
      return groups;
    }, {} as Record<string, FieldDiff[]>);
  }

  static calculateOverallConfidence(diffs: FieldDiff[]): number {
    if (diffs.length === 0) return 0;

    const totalConfidence = diffs.reduce((sum, diff) => sum + diff.confidence_score, 0);
    return totalConfidence / diffs.length;
  }
}