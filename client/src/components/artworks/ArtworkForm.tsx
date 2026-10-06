import {
  ARTWORK_TYPES,
  artworkInputSchema,
  type ArtworkFormInput,
  type ArtworkInput,
} from '@art-gallery/shared';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import {
  Controller,
  useWatch,
  type Control,
  type FieldError as FormFieldError,
} from 'react-hook-form';
import { FormTextField } from '@/components/form/FormTextField';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ARTWORK_TYPE_STYLES } from '@/lib/artwork-types';

const PREVIEW_DEBOUNCE_MS = 300;

type ArtworkControl = Control<ArtworkFormInput, unknown, ArtworkInput>;

interface ArtworkFormProps {
  control: ArtworkControl;
}

/** The artwork fields, bound to a form owned by the caller (`ArtworkFormDialog`). */
export function ArtworkForm({ control }: ArtworkFormProps) {
  return (
    <FieldGroup>
      <FormTextField control={control} name="title" label="Title" autoComplete="off" />
      <FormTextField control={control} name="artist" label="Artist" autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <TypeField control={control} />
        <PriceField control={control} />
      </div>
      <AvailabilityField control={control} />
      <ImageUrlField control={control} />
    </FieldGroup>
  );
}

function ErrorMessage({ id, error }: { id: string; error: FormFieldError | undefined }) {
  return error ? <FieldError id={id} errors={[error]} /> : null;
}

function TypeField({ control }: ArtworkFormProps) {
  return (
    <Controller
      control={control}
      name="type"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="type">Type</FieldLabel>
          <Select
            name={field.name}
            value={field.value ?? ''}
            onValueChange={field.onChange}
            // The trigger loses focus while the list is open, so "touched" means "closed".
            onOpenChange={(open) => {
              if (!open) field.onBlur();
            }}
          >
            <SelectTrigger
              id="type"
              ref={field.ref}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? 'type-error' : undefined}
              className="w-full"
            >
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {ARTWORK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ARTWORK_TYPE_STYLES[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorMessage id="type-error" error={fieldState.error} />
        </Field>
      )}
    />
  );
}

function PriceField({ control }: ArtworkFormProps) {
  return (
    <Controller
      control={control}
      name="price"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="price">Price</FieldLabel>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
            >
              $
            </span>
            <Input
              id="price"
              ref={field.ref}
              name={field.name}
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.01}
              placeholder="0.00"
              // Empty (or half-typed, e.g. "-") reads as NaN, which the schema reports as missing.
              value={Number.isFinite(field.value) ? field.value : ''}
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? 'price-error' : undefined}
              className="pl-6"
            />
          </div>
          <ErrorMessage id="price-error" error={fieldState.error} />
        </Field>
      )}
    />
  );
}

function AvailabilityField({ control }: ArtworkFormProps) {
  return (
    <Controller
      control={control}
      name="availability"
      render={({ field }) => (
        <Field orientation="horizontal">
          <Switch
            id="availability"
            ref={field.ref}
            name={field.name}
            checked={field.value ?? true}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            aria-describedby="availability-description"
          />
          <FieldContent>
            <FieldLabel htmlFor="availability">Availability</FieldLabel>
            <FieldDescription id="availability-description">
              {(field.value ?? true) ? 'For sale' : 'Exhibition only'}
            </FieldDescription>
          </FieldContent>
        </Field>
      )}
    />
  );
}

function ImageUrlField({ control }: ArtworkFormProps) {
  const imageUrl = useWatch({ control, name: 'imageUrl' });
  const debouncedUrl = useDebouncedValue(imageUrl ?? '', PREVIEW_DEBOUNCE_MS);
  const parsed = artworkInputSchema.shape.imageUrl.safeParse(debouncedUrl);
  const previewSrc = parsed.success ? parsed.data : null;

  return (
    <div className="space-y-3">
      <FormTextField
        control={control}
        name="imageUrl"
        label="Image URL (optional)"
        type="url"
        inputMode="url"
        autoComplete="off"
        placeholder="https://example.com/artwork.jpg"
      />
      {previewSrc && <ImagePreview key={previewSrc} src={previewSrc} />}
    </div>
  );
}

/** A thumbnail of a valid URL, or a note when nothing loads from it. Keyed by `src`. */
function ImagePreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageOff className="size-4" aria-hidden="true" />
        Couldn't load an image from this URL
      </p>
    );
  }
  return (
    <img
      src={src}
      alt="Image preview"
      decoding="async"
      onError={() => setFailed(true)}
      className="aspect-4/3 w-32 rounded-md bg-muted object-cover"
    />
  );
}
