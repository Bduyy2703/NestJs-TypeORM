import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Request,
  Put,
  Delete,
  Param,
  Get,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ApiBody, ApiConsumes, ApiTags, ApiSecurity, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { MinioService } from "../files/minio/minio.service";
import { FileRepository } from "../files/file.repository";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Public } from "src/cores/decorators/public.decorator";
import { SearchProductDto } from "./dto/search-product.dto";
import { SuggestProductDto } from "./dto/suggestProducts.dto";

@Controller("products")
@ApiTags("Products")
@ApiSecurity("JWT-auth")
export class ProductsController {
  constructor(
    private readonly productsService: ProductService,
    private readonly minioService: MinioService,
    private readonly fileRepository: FileRepository
  ) { }

  @Post("create")
  @Actions("create")
  @Objectcode("PRODUCT01")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: multer.memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
    })
  )
  @ApiOperation({ summary: "Tạo sản phẩm mới và hình ảnh của sản phẩm đó" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        originalPrice: { type: "number" },
        categoryId: { type: "string" },
        saleStrategyId: { type: "string" },
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException("User ID is required");
    const product = await this.productsService.createProduct(createProductDto);

    let uploadedImages = [];
    if (files && files.length > 0) {
      uploadedImages = await Promise.all(
        files.map(async (file) => {
          const uuid = uuidv4();
          const objectName = `product-${product.id}/${uuid}-${file.originalname}`;

          await this.minioService.uploadFileFromBuffer(
            "public",
            objectName,
            file.buffer,
            file.mimetype
          );

          const fileUrl = await this.minioService.getUrlByName("public", [
            objectName,
          ]);

          return this.fileRepository.createFile({
            fileId: uuid,
            bucketName: "public",
            fileName: objectName,
            fileUrl: fileUrl[0],
            targetId: product.id,
            targetType: "product",
          });
        })
      );
    }

    return {
      message: "Product created successfully",
      product,
      images: uploadedImages,
    };
  }


  @Get()
  @Public()
  @ApiOperation({ summary: "Lấy danh sách tất cả các sản phẩm" })
  async getAllProducts(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10
  ) {
    return this.productsService.getAllProducts(page, limit);
  }


  @Get(":id")
  @ApiOperation({ summary: "Lấy sản phẩm theo id" })
  @Public()
  async getProductById(@Param("id") id: number) {
    const product = await this.productsService.getProductById(id);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }


  @Put(":id")
  @Actions("update")
  @Objectcode("PRODUCT01")
  @ApiOperation({ summary: "cập nhật sản phẩm và hình ảnh của sản phẩm" })
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: multer.memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 }, // Giới hạn 10MB/file
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        originalPrice: { type: "number" },
        categoryId: { type: "string" },
        saleStrategyId: { type: "string" },
        keepFiles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fileId: { type: "string" },
              fileName: { type: "string" },
              bucketName: { type: "string" },
            },
            required: ["fileId", "fileName", "bucketName"],
          },
        },
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  async updateProduct(
    @Param("id") id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Body("keepFiles") keepFiles: { fileId: string; fileName: string; bucketName: string }[],
  ) {
    return this.productsService.updateProduct(id, updateProductDto, files, keepFiles);
  }

  @Delete(":id")
  @Actions("delete")
  @Objectcode("PRODUCT01")
  @ApiOperation({ summary: "xóa sản phẩm" })
  async deleteProduct(@Param("id") id: number) {
    return this.productsService.deleteProduct(id);
  } @Post('search')
  @Public()
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm với Elasticsearch' })
  @ApiBody({ type: SearchProductDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm tìm kiếm thành công',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Nhẫn bạc nam phong cách',
            originalPrice: 260000,
            finalPrice: 260000,
            categoryId: 4,
            categoryName: 'Nhẫn bạc 925',
            totalSold: 22,
            images: ['https://minio.dclux.store/public/product-1/e3221014-e635-4462-9d39-f563623b55e8-vun502-vun504-1704189251462.webp'],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: ['sortBy must be one of the following values: finalPrice.asc, finalPrice.desc, totalSold.desc, name.asc'],
        error: 'Bad Request',
      },
    },
  })
  async searchProducts(@Body() searchDto: SearchProductDto) {
    return this.productsService.searchProducts(searchDto);
  }

  @Post('sync')
  @Public()
  @ApiOperation({ summary: 'Đồng bộ sản phẩm từ database sang Elasticsearch' })
  @ApiResponse({
    status: 200,
    description: 'Đồng bộ thành công',
    schema: { example: { message: 'Đồng bộ sản phẩm thành công' } },
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi khi đồng bộ',
    schema: { example: { message: 'Không thể đồng bộ sản phẩm vào Elasticsearch' } },
  })
  async syncProducts() {
    await this.productsService.syncProductsToElasticsearch();
    return { message: 'Đồng bộ sản phẩm thành công' };
  }
@Post('suggest')
  @Public()
  @ApiOperation({ summary: 'Gợi ý sản phẩm dựa trên từ khóa' })
  @ApiBody({ type: SuggestProductDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách gợi ý sản phẩm',
    schema: {
      example: {
        suggestions: [
          {
            id: 1,
            name: 'Nhẫn bạc nam phong cách',
            image: 'https://minio.dclux.store/...',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async suggestProducts(@Body() suggestDto: SuggestProductDto) {
    return this.productsService.suggestProducts(suggestDto);
  }
}
