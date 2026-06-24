import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  SsoAuthGuard,
  type CurrentUserPayload,
} from '@hemia/auth/nestjs';
import { CreateUserDto } from './dtos/create-user.dto';
import { ListUsersQueryDto } from './dtos/list-users-query.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserParamDto } from './dtos/user-param.dto';
import { UsersService } from './users.service';

@UseGuards(SsoAuthGuard)
@Controller('identity-access/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query() query: ListUsersQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.usersService.findAll(query, currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.usersService.create(dto, currentUser);
  }

  @Get(':id')
  async findOne(
    @Param() params: UserParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.usersService.findOne(params.id, currentUser);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param() params: UserParamDto,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.usersService.updateStatus(params.id, dto, currentUser);
  }

  @Patch(':id/lock')
  async lock(
    @Param() params: UserParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.usersService.lock(params.id, currentUser);
  }

  @Patch(':id/unlock')
  async unlock(
    @Param() params: UserParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.usersService.unlock(params.id, currentUser);
  }

  @Patch(':id')
  async update(
    @Param() params: UserParamDto,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.usersService.update(params.id, dto, currentUser);
  }

  @Delete(':id')
  async remove(
    @Param() params: UserParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.usersService.remove(params.id, currentUser);
  }
}
