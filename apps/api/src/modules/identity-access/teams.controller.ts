import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateTeamDto } from './dtos/create-team.dto';
import { TeamParamDto } from './dtos/team-param.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { TeamsService } from './teams.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(@Req() request: Request): Promise<unknown> {
    return this.teamsService.findAll(extractHemiaIdAuth(request));
  }

  @Post()
  create(@Body() dto: CreateTeamDto, @Req() request: Request): Promise<unknown> {
    return this.teamsService.create(dto, extractHemiaIdAuth(request));
  }

  @Get(':id')
  findOne(
    @Param() params: TeamParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.teamsService.findOne(params.id, extractHemiaIdAuth(request));
  }

  @Patch(':id')
  update(
    @Param() params: TeamParamDto,
    @Body() dto: UpdateTeamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.teamsService.update(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id')
  remove(
    @Param() params: TeamParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.teamsService.remove(params.id, extractHemiaIdAuth(request));
  }
}
