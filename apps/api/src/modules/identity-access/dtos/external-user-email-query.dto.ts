import { IsEmail } from 'class-validator';

export class ExternalUserEmailQueryDto {
  @IsEmail({}, { message: 'El email debe ser valido' })
  email: string;
}
