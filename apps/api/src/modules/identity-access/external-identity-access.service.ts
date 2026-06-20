import { Injectable } from '@nestjs/common';
import { HemiaIdExternalClient } from '../../integrations/hemia-id/hemia-id-external.client';
import { CreateInvitationDto } from './dtos/create-invitation.dto';

@Injectable()
export class ExternalIdentityAccessService {
  constructor(private readonly hemiaIdExternalClient: HemiaIdExternalClient) {}

  findUserByEmail(email: string): Promise<unknown> {
    return this.hemiaIdExternalClient.request({
      method: 'GET',
      path: '/users/by-email',
      query: { email },
    });
  }

  findUserBySub(sub: string): Promise<unknown> {
    return this.hemiaIdExternalClient.request({
      method: 'GET',
      path: `/users/by-sub/${sub}`,
    });
  }

  findMembershipsBySub(sub: string): Promise<unknown> {
    return this.hemiaIdExternalClient.request({
      method: 'GET',
      path: `/users/${sub}/memberships`,
    });
  }

  findTeams(): Promise<unknown> {
    return this.hemiaIdExternalClient.request({
      method: 'GET',
      path: '/teams',
    });
  }

  createInvitation(dto: CreateInvitationDto): Promise<unknown> {
    return this.hemiaIdExternalClient.request({
      method: 'POST',
      path: '/invitations',
      body: dto,
    });
  }

  resendInvitation(id: string): Promise<unknown> {
    return this.hemiaIdExternalClient.request({
      method: 'POST',
      path: `/invitations/${id}/resend`,
    });
  }

  cancelInvitation(id: string): Promise<unknown> {
    return this.hemiaIdExternalClient.request({
      method: 'POST',
      path: `/invitations/${id}/cancel`,
    });
  }

  findEvents(): Promise<unknown> {
    return this.hemiaIdExternalClient.request({
      method: 'GET',
      path: '/events',
    });
  }
}
