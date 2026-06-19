import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateUserDto } from './dtos/create-user.dto';
import { ListUsersQueryDto } from './dtos/list-users-query.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserParamDto } from './dtos/user-param.dto';
import { UsersService } from './users.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query() query: ListUsersQueryDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.usersService.findAll(query, extractHemiaIdAuth(request));
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Req() request: Request): Promise<unknown> {
    return this.usersService.create(dto, extractHemiaIdAuth(request));
  }

  @Get(':id')
  findOne(
    @Param() params: UserParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.usersService.findOne(params.id, extractHemiaIdAuth(request));
  }

  @Patch(':id/status')
  updateStatus(
    @Param() params: UserParamDto,
    @Body() dto: UpdateUserStatusDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.usersService.updateStatus(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Patch(':id/lock')
  lock(
    @Param() params: UserParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.usersService.lock(params.id, extractHemiaIdAuth(request));
  }

  @Patch(':id/unlock')
  unlock(
    @Param() params: UserParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.usersService.unlock(params.id, extractHemiaIdAuth(request));
  }

  @Patch(':id')
  update(
    @Param() params: UserParamDto,
    @Body() dto: UpdateUserDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.usersService.update(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id')
  remove(
    @Param() params: UserParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.usersService.remove(params.id, extractHemiaIdAuth(request));
  }
}
