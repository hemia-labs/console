import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../../integrations/access/access-admin.client';
import {
  CreateProductDto,
  EnableProductDto,
  UpdateProductDto,
} from '../dtos/access.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  findAll(accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: '/v1/products',
      },
      accessToken,
    );
  }

  findOne(productCode: string, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: `/v1/products/${productCode}`,
      },
      accessToken,
    );
  }

  create(dto: CreateProductDto, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: '/v1/products',
        body: dto,
      },
      accessToken,
    );
  }

  update(
    productCode: string,
    dto: UpdateProductDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'PATCH',
        path: `/v1/products/${productCode}`,
        body: dto,
      },
      accessToken,
    );
  }

  findOrganizationProducts(
    organizationId: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: `/v1/organizations/${organizationId}/products`,
      },
      accessToken,
    );
  }

  enable(
    organizationId: string,
    productCode: string,
    dto: EnableProductDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/organizations/${organizationId}/products/${productCode}/enable`,
        body: dto,
      },
      accessToken,
    );
  }

  suspend(
    organizationId: string,
    productCode: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.changeStatus(
      organizationId,
      productCode,
      'suspend',
      accessToken,
    );
  }

  activate(
    organizationId: string,
    productCode: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.changeStatus(
      organizationId,
      productCode,
      'activate',
      accessToken,
    );
  }

  disable(
    organizationId: string,
    productCode: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.changeStatus(
      organizationId,
      productCode,
      'disable',
      accessToken,
    );
  }

  private changeStatus(
    organizationId: string,
    productCode: string,
    action: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/organizations/${organizationId}/products/${productCode}/${action}`,
      },
      accessToken,
    );
  }
}
