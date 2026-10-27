import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  SsoAuthGuard,
  type CurrentUserPayload,
} from '@hemia/auth/nestjs';
import { toConsoleUser, type ConsoleUser } from './console-user';

@Controller('me')
@UseGuards(SsoAuthGuard)
export class MeController {
  @Get()
  @Header('Cache-Control', 'no-store')
  me(@CurrentUser() user: CurrentUserPayload): ConsoleUser {
    return toConsoleUser(user);
  }
}
