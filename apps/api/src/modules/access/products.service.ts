import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../integrations/access/access-admin.client';
import {
  CreateProductDto,
  EnableProductDto,
  UpdateProductDto,
} from './dtos/access.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  findAll(): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: '/v1/products',
    });
  }

  findOne(productCode: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: `/v1/products/${productCode}`,
    });
  }

  create(dto: CreateProductDto): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: '/v1/products',
      body: dto,
    });
  }

  update(productCode: string, dto: UpdateProductDto): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'PATCH',
      path: `/v1/products/${productCode}`,
      body: dto,
    });
  }

  findOrganizationProducts(organizationId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: `/v1/organizations/${organizationId}/products`,
    });
  }

  enable(
    organizationId: string,
    productCode: string,
    dto: EnableProductDto,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/organizations/${organizationId}/products/${productCode}/enable`,
      body: dto,
    });
  }

  suspend(organizationId: string, productCode: string): Promise<unknown> {
    return this.changeStatus(organizationId, productCode, 'suspend');
  }

  activate(organizationId: string, productCode: string): Promise<unknown> {
    return this.changeStatus(organizationId, productCode, 'activate');
  }

  disable(organizationId: string, productCode: string): Promise<unknown> {
    return this.changeStatus(organizationId, productCode, 'disable');
  }

  private changeStatus(
    organizationId: string,
    productCode: string,
    action: string,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/organizations/${organizationId}/products/${productCode}/${action}`,
    });
  }
}
