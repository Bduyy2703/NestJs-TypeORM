import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Request,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ApiBody, ApiConsumes, ApiTags, ApiSecurity } from "@nestjs/swagger";
import { MinioService } from "../files/minio/minio.service";
import { FileRepository } from "../files/file.repository";

@Controller("products")
@ApiTags("Products")
@ApiSecurity("JWT-auth")
export class ProductsController {
  constructor(
    private readonly productsService: ProductService,
    private readonly minioService: MinioService,
    private readonly fileRepository: FileRepository
  ) {}

  @Post("create")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: multer.memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        price: { type: "number" },
        categoryId: { type: "string" },
        inventoryId: { type: "string" },
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

    // ✅ Tạo sản phẩm trước
    const product = await this.productsService.createProduct(createProductDto);

    let uploadedImages = [];
    if (files && files.length > 0) {
      uploadedImages = await Promise.all(
        files.map(async (file) => {
          const uuid = uuidv4();
          const objectName = `product-${product.id}/${uuid}-${file.originalname}`;

          // ✅ Upload file lên MinIO
          await this.minioService.uploadFileFromBuffer(
            "public",
            objectName,
            file.buffer,
            file.mimetype
          );

          const fileUrl = await this.minioService.getUrlByName("public", [
            objectName,
          ]);

          // ✅ Lưu thông tin file vào bảng `File`
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
}
