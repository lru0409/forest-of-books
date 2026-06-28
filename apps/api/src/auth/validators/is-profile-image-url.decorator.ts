import { IsUrl, type ValidationOptions } from 'class-validator';

export function IsProfileImageUrl(validationOptions?: ValidationOptions): PropertyDecorator {
  return IsUrl(process.env.NODE_ENV === 'development' ? { require_tld: false } : undefined, validationOptions);
}
