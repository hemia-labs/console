import { IsString } from 'class-validator';

export class UpdateMembershipStatusDto {
  @IsString({ message: 'El status debe ser una cadena de texto' })
  status: string;
}
