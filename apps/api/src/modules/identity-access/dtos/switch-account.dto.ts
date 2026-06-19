import { IsInt, Min } from 'class-validator';

export class SwitchAccountDto {
  @IsInt({ message: 'El accountIndex debe ser un entero' })
  @Min(0, { message: 'El accountIndex debe ser mayor o igual a 0' })
  accountIndex: number;
}
