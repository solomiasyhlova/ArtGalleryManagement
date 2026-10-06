import { ERROR_CODES, type ApiErrorBody } from '@art-gallery/shared';
import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/http-error.js';

interface BodyParserClientError {
  type: string;
  status: number;
  message: string;
}

/** body-parser errors caused by the request (malformed JSON, too large, bad charset, ...). */
function isBodyParserClientError(err: unknown): err is BodyParserClientError {
  if (typeof err !== 'object' || err === null) return false;
  const { type, status, expose } = err as Record<string, unknown>;
  return (
    typeof type === 'string' &&
    typeof status === 'number' &&
    status >= 400 &&
    status < 500 &&
    expose === true
  );
}

function toBody(err: HttpError): ApiErrorBody {
  return {
    error: {
      code: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    },
  };
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // Express's default handler closes the connection if the response already started.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json(toBody(err));
    return;
  }

  if (isBodyParserClientError(err)) {
    // The parse error message echoes JSON parser internals, so replace it.
    const message = err.type === 'entity.parse.failed' ? 'Malformed JSON body' : err.message;
    res
      .status(err.status)
      .json(toBody(new HttpError(err.status, ERROR_CODES.VALIDATION_ERROR, message)));
    return;
  }

  console.error(err);
  res
    .status(500)
    .json(toBody(new HttpError(500, ERROR_CODES.INTERNAL_ERROR, 'Internal server error')));
};
