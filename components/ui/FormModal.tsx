'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller, DefaultValues, FieldValues, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { $ZodType } from 'zod/v4/core'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addToast } from '@/components/ui/Toast'

/** Supported field types for dynamic rendering */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'textarea'
  | 'select'
  | 'date'

/** Option for select fields */
export interface SelectOption {
  label: string
  value: string
}

/** Field definition for dynamic form rendering */
export interface FormFieldDef<T extends FieldValues> {
  /** Field name — must match a key in the Zod schema */
  name: Path<T>
  /** Display label */
  label: string
  /** Input type */
  type: FormFieldType
  /** Placeholder text */
  placeholder?: string
  /** Options for select fields */
  options?: SelectOption[]
  /** Whether field spans full width (for textarea) */
  fullWidth?: boolean
}

interface FormModalProps<T extends FieldValues> {
  /** Whether modal is open */
  open: boolean
  /** Close handler */
  onOpenChange: (_open: boolean) => void
  /** Modal title */
  title: string
  /** Optional description below title */
  description?: string
  /** Zod schema for validation */
  schema: $ZodType<T, T>
  /** Field definitions */
  fields: FormFieldDef<T>[]
  /** Default values for edit mode */
  defaultValues?: Partial<T>
  /** Server action to call on submit */
  onSubmit: (_data: T) => Promise<{ success: boolean; error?: string }>
  /** Success toast message */
  successMessage?: string
  /** Submit button label */
  submitLabel?: string
  /** Callback after successful submit */
  onSuccess?: () => void
}

export function FormModal<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  fields,
  defaultValues,
  onSubmit,
  successMessage = 'Saved successfully.',
  submitLabel = 'Save',
  onSuccess,
}: FormModalProps<T>) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T> | undefined,
  })

  function handleFormSubmit(data: T) {
    setServerError(null)
    startTransition(async () => {
      const result = await onSubmit(data)
      if (result.success) {
        addToast('success', successMessage)
        reset()
        onOpenChange(false)
        onSuccess?.()
      } else {
        setServerError(result.error ?? 'An unexpected error occurred.')
        addToast('error', result.error ?? 'An unexpected error occurred.')
      }
    })
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      reset()
      setServerError(null)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="grid gap-4">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.fullWidth ? 'col-span-full' : ''}
              >
                <Label htmlFor={field.name} className="mb-2 block">
                  {field.label}
                </Label>

                {field.type === 'select' ? (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Select
                        value={controllerField.value ?? ''}
                        onValueChange={controllerField.onChange}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue
                            placeholder={
                              field.placeholder ?? `Select ${field.label}`
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    {...register(field.name)}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled={isPending}
                    {...register(field.name)}
                  />
                )}

                {errors[field.name] && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors[field.name]?.message as string}
                  </p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
