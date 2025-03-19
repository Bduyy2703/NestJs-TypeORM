import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "./entity/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { Category } from "src/modules/category/entity/category.entity";
import { StrategySale } from "src/modules/strategySale/entity/strategySale.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { UpdateProductDto } from "./dto/update-product.dto";
import { FileRepository } from '../files/file.repository';
import { MinioService } from "../files/minio/minio.service";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(StrategySale) private readonly strategySaleRepository: Repository<StrategySale>,
    @InjectRepository(ProductDetails) private readonly productDetailsRepository: Repository<ProductDetails>,
    private readonly minioService: MinioService,
    private readonly fileService: FileRepository
  ) { }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, strategySaleId, productDetails, ...productData } = createProductDto;

    const category = categoryId
      ? await this.categoryRepository.findOne({ where: { id: categoryId } })
      : null;
    if (categoryId && !category) throw new NotFoundException("Danh mục không tồn tại!");


    const strategySale = strategySaleId
      ? await this.strategySaleRepository.findOne({ where: { id: strategySaleId } })
      : null;
    if (strategySaleId && !strategySale) throw new NotFoundException("Chiến lược giảm giá không tồn tại!");

    const product = this.productRepository.create({
      ...productData,
      category,
      strategySale,
    });

    await this.productRepository.save(product);

    return product;
  }

  async getAllProducts(page: number, limit: number) {
    const [products, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ["productDetails"],
    });

    // ✅ Lấy danh sách sản phẩm kèm theo hình ảnh từ bảng File
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await this.fileService.findFilesByTarget(product.id, "product");
        return {
          ...product,
          images: images.map((img) => img.fileUrl), // Trả về danh sách URL hình ảnh
        };
      })
    );

    return {
      data: productsWithImages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }


  async getProductById(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ["productDetails"],
    });

    if (!product) {
      throw new NotFoundException("Sản phẩm không tồn tại!");
    }

    const images = await this.fileService.findFilesByTarget(id, "product");

    return {
      ...product,
      images: images.map((img) => img.fileUrl),
    };
  }


  async updateProduct(
    id: number,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[],
    keepFiles: { fileId: string; fileName: string; bucketName: string }[],
  ) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException("Sản phẩm không tồn tại!");
    
    await this.productRepository.save({...updateProductDto });

    const oldImages = await this.fileService.findFilesByTarget(id, "product");

    if (keepFiles) {
      if (typeof keepFiles === "string") {
        try {
          keepFiles = JSON.parse(keepFiles);
        } catch (error) {
          throw new BadRequestException("keepFiles không đúng định dạng JSON!");
        }
      }
      if (!Array.isArray(keepFiles)) {
        keepFiles = [keepFiles];
      }
    } else {
      keepFiles = [];
    }

    const keepFilesSet = new Set(keepFiles.map((file) => file.fileId));

    const removedImages = oldImages.filter((img) => !keepFilesSet.has(img.fileId));

    for (const image of removedImages) {
      await this.minioService.deleteFile(image.bucketName, image.fileName);
      await this.fileService.Delete(image.fileId);
    }

    // 🔹 Upload ảnh mới
    const newUploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const uuid = uuidv4();
        const objectName = `product-${id}/${uuid}-${file.originalname}`;

        await this.minioService.uploadFileFromBuffer(
          "public",
          objectName,
          file.buffer,
          file.mimetype
        );

        const fileUrl = await this.minioService.getUrlByName("public", [objectName]);

        const fileData = await this.fileService.createFile({
          fileId: uuid,
          bucketName: "public",
          fileName: objectName,
          fileUrl: fileUrl[0],
          targetId: id,
          targetType: "product",
        });

        newUploadedFiles.push(fileData.fileUrl);
      }
    }

    return {
      message: "Sản phẩm cập nhật thành công!",
      updatedImages: [...keepFiles.map((f) => f.fileName), ...newUploadedFiles],
    };
  }



  async deleteProduct(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ["productDetails"],
    });

    if (!product) throw new NotFoundException("Sản phẩm không tồn tại!");

    if (product.productDetails.length > 0) {
      await this.productDetailsRepository.remove(product.productDetails);
    }

    const images = await this.fileService.findFilesByTarget(id, "product");

    for (const image of images) {
      await this.minioService.deleteFile(image.bucketName, image.fileName);
      await this.fileService.Delete(image.fileId);
    }

    await this.productRepository.remove(product);

    return { message: "Sản phẩm đã được xóa thành công!" };
  }

}
