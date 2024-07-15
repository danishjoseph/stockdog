import { validate } from 'class-validator';

export const validateAndThrowError = async (dto: object, dtoName: string) => {
  const errors = await validate(dto);
  if (errors.length > 0) {
    throw new Error(
      `Validation failed for ${dtoName} : ${JSON.stringify(errors)}`,
    );
  }
};
