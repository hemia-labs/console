import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../identity-access/sso-current-user-auth.guard';
import {
  CreateProductDto,
  EnableProductDto,
  UpdateProductDto,
} from './dtos/access.dto';
import { ProductsService } from './products.service';

@Controller('access')
@UseGuards(SsoCurrentUserAuthGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  findAll() {
    return this.products.findAll();
  }

  @Post('products')
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Get('products/:productCode')
  findOne(@Param('productCode') productCode: string) {
    return this.products.findOne(productCode);
  }

  @Patch('products/:productCode')
  update(
    @Param('productCode') productCode: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(productCode, dto);
  }

  @Get('organizations/:organizationId/products')
  findOrganizationProducts(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.products.findOrganizationProducts(organizationId);
  }

  @Post('organizations/:organizationId/products/:productCode/enable')
  enable(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('productCode') productCode: string,
    @Body() dto: EnableProductDto,
  ) {
    return this.products.enable(organizationId, productCode, dto);
  }

  @Post('organizations/:organizationId/products/:productCode/suspend')
  suspend(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('productCode') productCode: string,
  ) {
    return this.products.suspend(organizationId, productCode);
  }

  @Post('organizations/:organizationId/products/:productCode/activate')
  activate(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('productCode') productCode: string,
  ) {
    return this.products.activate(organizationId, productCode);
  }

  @Post('organizations/:organizationId/products/:productCode/disable')
  disable(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('productCode') productCode: string,
  ) {
    return this.products.disable(organizationId, productCode);
  }
}
