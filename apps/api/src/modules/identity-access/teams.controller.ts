import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type CurrentUserPayload } from '@hemia/auth/nestjs';

import { SsoCurrentUserAuthGuard } from './sso-current-user-auth.guard';
import { CreateTeamDto } from './dtos/create-team.dto';
import { TeamParamDto } from './dtos/team-param.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { TeamsService } from './teams.service';

@UseGuards(SsoCurrentUserAuthGuard)
@Controller('identity-access/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.teamsService.findAll(currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreateTeamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.teamsService.create(dto, currentUser);
  }

  @Get(':id')
  async findOne(
    @Param() params: TeamParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.teamsService.findOne(params.id, currentUser);
  }

  @Patch(':id')
  async update(
    @Param() params: TeamParamDto,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.teamsService.update(params.id, dto, currentUser);
  }

  @Delete(':id')
  async remove(
    @Param() params: TeamParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.teamsService.remove(params.id, currentUser);
  }
}
