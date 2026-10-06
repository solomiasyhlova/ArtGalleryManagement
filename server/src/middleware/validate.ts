import { ERROR_CODES, type ErrorDetails } from '@art-gallery/shared';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from '../utils/http-error.js';

const PARTS = ['body', 'query', 'params'] as const;

type Part = (typeof PARTS)[number];

export type ValidationSchemas = Partial<Record<Part, z.ZodType>>;

export type Validated = Partial<Record<Part, unknown>>;

function toDetails(part: Part, error: z.ZodError): ErrorDetails {
  // The schema is generic here, so view the error as one over an object to get string[] per field.
  const { formErrors, fieldErrors } = z.flattenError(error as z.ZodError<Record<string, unknown>>);
  const details: ErrorDetails = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) details[field] = messages;
  }
  // Errors on the part itself (e.g. a missing body) have no field, so key them by the part.
  if (formErrors.length) details[part] = formErrors;
  return details;
}

/**
 * Parses `req.body` / `req.query` / `req.params` with the given schemas and stores the
 * results in `res.locals.validated` (Express 5's `req.query` can't be reassigned).
 * Unknown object keys are stripped by Zod's default object behavior.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return async (req, res, next) => {
    const validated: Validated = {};
    const failedParts: Part[] = [];
    let details: ErrorDetails = {};

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = await schema.safeParseAsync(req[part]);
      if (result.success) {
        validated[part] = result.data;
      } else {
        failedParts.push(part);
        details = { ...details, ...toDetails(part, result.error) };
      }
    }

    if (failedParts.length) {
      const message =
        failedParts.length === 1 ? `Invalid request ${failedParts[0]}` : 'Invalid request';
      next(new HttpError(400, ERROR_CODES.VALIDATION_ERROR, message, details));
      return;
    }

    res.locals.validated = validated;
    next();
  };
}
