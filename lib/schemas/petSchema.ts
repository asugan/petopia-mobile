import { z } from 'zod';
import { BasePetSchema, PetFormSchema } from './common/basePetSchema';
import { objectIdSchema } from './core/validators';
import { dateStringSchema } from './core/dateSchemas';
import { t } from './core/i18n';

// Re-export common base schemas for convenience
export { BasePetSchema, PetFormSchema };

// Full Pet schema including server-side fields
export const PetSchema = () =>
  BasePetSchema().extend({
    _id: objectIdSchema(),
    createdAt: dateStringSchema(),
    updatedAt: dateStringSchema(),
  });

// Schema for form input (before transformation)
export const PetCreateFormSchema = () => PetFormSchema();

// Schema for creating a new pet (with transformation)
export const PetCreateSchema = () =>
  BasePetSchema().refine(
    (data) => {
      const nameValid = data.name && data.name.trim().length >= 2;
      const typeValid = !!data.type;
      return nameValid && typeValid;
    },
    {
      params: { i18nKey: 'forms.validation.pet.nameAndTypeRequired' },
      path: ['name'],
    }
  );

// Schema for updating an existing pet form (before transformation)
export const PetUpdateFormSchema = () => PetFormSchema().partial();

// Schema for updating an existing pet (with transformation)
export const PetUpdateSchema = () => BasePetSchema().partial();

// Type exports for TypeScript
export type Pet = z.infer<ReturnType<typeof PetSchema>>;
export type PetCreateInput = z.infer<ReturnType<typeof PetCreateSchema>>;
export type PetUpdateInput = z.infer<ReturnType<typeof PetUpdateSchema>>;
export type PetCreateFormInput = z.input<ReturnType<typeof PetCreateFormSchema>>;
export type PetUpdateFormInput = z.input<ReturnType<typeof PetUpdateFormSchema>>;

// Validation error type for better error handling
export type ValidationError = {
  path: string[];
  message: string;
};

// Helper function to format validation errors
export const formatValidationErrors = (error: z.ZodError): ValidationError[] => {
  return error.issues.map((err) => ({
    path: err.path.map(String),
    message: err.message,
  }));
};

// Custom validation rules specific to Turkey
export const TurkishPetValidations = {
  // Validate Turkish Identification Number (for future use)
  validateTurkishID: (tckn: string): boolean => {
    if (tckn.length !== 11) return false;
    if (!/^\d+$/.test(tckn)) return false;
    // Additional TC validation logic can be added here
    return true;
  },

  // Validate Turkish phone format (for future use)
  validateTurkishPhone: (phone: string): boolean => {
    const phoneRegex = /^(\+90|0)?[5-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Validate Turkish postal code (for future use)
  validateTurkishPostalCode: (postalCode: string): boolean => {
    const postalCodeRegex = /^\d{5}$/;
    return postalCodeRegex.test(postalCode);
  },
};
