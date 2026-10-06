import type { ComponentProps } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface FormTextFieldProps<T extends FieldValues, TParsed> extends Omit<
  ComponentProps<typeof Input>,
  'name' | 'id' | 'value' | 'defaultValue'
> {
  control: Control<T, unknown, TParsed>;
  name: Path<T>;
  label: string;
}

/** A labelled input bound to React Hook Form, with its error underneath (shadcn `Field`). */
export function FormTextField<T extends FieldValues, TParsed = T>({
  control,
  name,
  label,
  ...inputProps
}: FormTextFieldProps<T, TParsed>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorId = `${name}-error`;
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input
              {...inputProps}
              {...field}
              id={name}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? errorId : undefined}
            />
            {fieldState.invalid && <FieldError id={errorId} errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
