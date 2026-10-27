import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from '../../auth/authorization/console-authorization.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../../identity-access/sso-current-user-auth.guard';
import {
  CreateProductDto,
  EnableProductDto,
  UpdateProductDto,
} from '../dtos/access.dto';
import { ProductsService } from './products.service';

@Controller('access')
@UseGuards(SsoCurrentUserAuthGuard)
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly authorization: ConsoleAuthorizationService,
  ) {}

  @Get('products')
  async findAll(@Req() request: ConsoleRequest) {
    return this.products.findAll(
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('products')
  async create(@Req() request: ConsoleRequest, @Body() dto: CreateProductDto) {
    return this.products.create(
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Get('products/:productCode')
  async findOne(
    @Req() request: ConsoleRequest,
    @Param('productCode') productCode: string,
  ) {
    return this.products.findOne(
      productCode,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Patch('products/:productCode')
  async update(
    @Req() request: ConsoleRequest,
    @Param('productCode') productCode: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(
      productCode,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Get('organizations/:organizationId/products')
  async findOrganizationProducts(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.products.findOrganizationProducts(
      organizationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('organizations/:organizationId/products/:productCode/enable')
  async enable(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('productCode') productCode: string,
    @Body() dto: EnableProductDto,
  ) {
    return this.products.enable(
      organizationId,
      productCode,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('organizations/:organizationId/products/:productCode/suspend')
  async suspend(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('productCode') productCode: string,
  ) {
    return this.products.suspend(
      organizationId,
      productCode,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('organizations/:organizationId/products/:productCode/activate')
  async activate(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('productCode') productCode: string,
  ) {
    return this.products.activate(
      organizationId,
      productCode,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('organizations/:organizationId/products/:productCode/disable')
  async disable(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('productCode') productCode: string,
  ) {
    return this.products.disable(
      organizationId,
      productCode,
      await this.authorization.accessTokenFor(request),
    );
  }
}
