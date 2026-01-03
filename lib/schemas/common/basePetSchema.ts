import { z } from 'zod';
import { turkishNameValidator, weightValidator, optionalUrlValidator } from '../core/validators';
import { birthDateSchema } from '../core/dateSchemas';
import { PET_TYPES, PET_GENDERS } from '../core/constants';
import { t } from '../core/i18n';

/**
 * Base pet schema with common validation fields.
 * Used for pet-related schemas (create, update, form input).
 */
export const BasePetSchema = () =>
  z.object({
    name: turkishNameValidator(2, 50)
      .refine(
        (val) => val.trim().length >= 2,
        { message: t('forms.validation.pet.nameMin', { min: 2 }) }
      ),

    type: z.enum(PET_TYPES as unknown as [string, ...string[]], {
      message: t('forms.validation.pet.typeRequired'),
    }),

    breed: z
      .string()
      .max(100, { message: t('forms.validation.pet.breedMax') })
      .optional()
      .transform((val) => val?.trim() || undefined),

    birthDate: birthDateSchema(),

    weight: weightValidator().optional(),

    gender: z.enum(PET_GENDERS as unknown as [string, ...string[]], {
      message: t('forms.validation.pet.genderRequired'),
    }).optional(),

    profilePhoto: optionalUrlValidator(),
  });

/**
 * Pet schema for form input (before transformation).
 * Accepts Date objects or strings for birthDate.
 */
export const PetFormSchema = () =>
  z.object({
    name: z
      .string()
      .min(2, { message: t('forms.validation.pet.nameMin') })
      .max(50, { message: t('forms.validation.pet.nameMax') })
      .regex(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/, {
        message: t('forms.validation.pet.nameInvalidChars'),
      })
      .transform((val) => val.trim()),

    type: z.enum(PET_TYPES as unknown as [string, ...string[]], {
      message: t('forms.validation.pet.typeRequired'),
    }),

    breed: z
      .string()
      .max(100, { message: t('forms.validation.pet.breedMax') })
      .optional()
      .transform((val) => val?.trim() || undefined),

    birthDate: z
      .union([z.string(), z.date()])
      .refine((val) => {
        if (val instanceof Date) return !isNaN(val.getTime());
        if (typeof val === 'string') {
          const date = new Date(val);
          return !isNaN(date.getTime());
        }
        return false;
      }, {
        message: t('forms.validation.pet.birthDateInvalid'),
      })
      .refine((val) => {
        const date = val instanceof Date ? val : new Date(val);
        const now = new Date();
        const minDate = new Date(now.getFullYear() - 30, now.getMonth(), now.getDate());
        return date <= now && date >= minDate;
      }, {
        message: t('forms.validation.pet.birthDateRange'),
      })
      .optional(),

    weight: z
      .number()
      .positive({ message: t('forms.validation.pet.weightPositive') })
      .min(0.1, { message: t('forms.validation.pet.weightMin') })
      .max(200, { message: t('forms.validation.pet.weightMax') })
      .optional(),

    gender: z.enum(PET_GENDERS as unknown as [string, ...string[]], {
      message: t('forms.validation.pet.genderRequired'),
    }).optional(),

    profilePhoto: z
      .string()
      .optional()
      .or(z.literal('').transform(() => undefined))
      .refine((val) => {
        if (!val) return true;
        return (
          val.startsWith('file://') ||
          val.startsWith('/') ||
          val.startsWith('data:image/') ||
          val.startsWith('http')
        );
      }, {
        message: t('forms.validation.pet.photoInvalid'),
      }),
  });

export type BasePetInput = z.infer<ReturnType<typeof BasePetSchema>>;
export type PetFormInput = z.infer<ReturnType<typeof PetFormSchema>>;
