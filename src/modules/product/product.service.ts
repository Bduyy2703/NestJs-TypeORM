import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Product } from "./entity/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { Category } from "src/modules/category/entity/category.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { UpdateProductDto } from "./dto/update-product.dto";
import { FileRepository } from '../files/file.repository';
import { MinioService } from "../files/minio/minio.service";
import { ProductStrategySale } from "../strategySale/entity/productSale.entity";
import { StrategySale } from "../strategySale/entity/strategySale.entity";
import { ElasticsearchService } from "src/elastic_search/elasticsearch.service";
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(StrategySale) private readonly strategySaleRepository: Repository<StrategySale>,
    @InjectRepository(ProductStrategySale) private readonly strategyProductSaleRepository: Repository<ProductStrategySale>,
    @InjectRepository(ProductDetails) private readonly productDetailsRepository: Repository<ProductDetails>,
    private readonly minioService: MinioService,
    private readonly fileService: FileRepository,
    private readonly elasticsearchService: ElasticsearchService,
  ) { }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, strategySaleIds, ...productData } = createProductDto;

    // Kiểm tra danh mục
    const category = categoryId
      ? await this.categoryRepository.findOne({ where: { id: categoryId } })
      : null;
    if (categoryId && !category) throw new NotFoundException("Danh mục không tồn tại!");

    // Tạo sản phẩm trước
    const final_price = createProductDto.originalPrice
    const product = this.productRepository.create({
      ...productData,
      finalPrice: final_price,
      category,
    });

    await this.productRepository.save(product);

    // Nếu có chiến lược giảm giá, thêm vào bảng trung gian
    if (strategySaleIds && strategySaleIds.length > 0) {
      const strategySales = await this.strategySaleRepository.find({
        where: { id: In(strategySaleIds), isActive: false }, // Kiểm tra theo id của StrategySale
      });

      if (strategySales.length !== strategySaleIds.length) {
        throw new NotFoundException("Một hoặc nhiều chiến lược giảm giá không tồn tại!");
      }

      const productStrategySales = strategySales.map((strategySale) =>
        this.strategyProductSaleRepository.create({
          product,
          strategySale,
        })
      );

      await this.strategyProductSaleRepository.save(productStrategySales);
    }
    await this.syncProductToElasticsearch(product);
    return product;
  }async searchProducts(searchDto: SearchProductDto) {
    const { keyword, categoryIds, priceMin, priceMax, materials, sizes, sortBy, page = 1, limit = 10 } = searchDto;

    // Xử lý sortBy
    let sort: any[] = [];
    if (sortBy) {
      const [field, direction] = sortBy.split('.');
      if (['finalPrice', 'finalPrice', 'totalSold', 'name'].includes(field) && ['asc', 'desc'].includes(direction)) {
        sort.push({ [field]: direction });
      } else {
        sort.push({ finalPrice: 'asc' }); // Mặc định nếu sortBy không hợp lệ
      }
    } else {
      sort.push({ finalPrice: 'asc' }); // Mặc định
    }

    // Xây dựng query Elasticsearch
    const query: any = {
      bool: {
        must: [],
        filter: [],
      },
    };

    // Thêm từ khóa tìm kiếm
    if (keyword) {
      query.bool.must.push({
        multi_match: {
          query: keyword,
          fields: ['name^2', 'content'],
        },
      });

    // Thêm bộ lọc danh mục
    if (categoryIds?.length) {
      query.bool.filter.push({
        terms: { categoryId: categoryIds },
      });
    }

    // Thêm bộ lọc giá
    if (priceMin || priceMax) {
      query.bool.filter.push({
        range: {
          finalPrice: {
            gte: priceMin,
            lte: priceMax,
          },
    }});
      }
    }

    // Thêm bộ lọc chất liệu
    if (materials?.length) {
      query.bool.filter.push({
        terms: { materials: materials },
      });
    }

    // Thêm bộ lọc kích thước
    if (sizes?.length) {
      query.bool.filter.push({
        terms: { sizes: sizes },
      });
    }

    try {
      const client = this.elasticsearchService.getClient();
      const result = await client.search({
        index: 'products',
        body: {
          query: query.body,
          sort: sort,
          from: (page - 1) * limit,
          size: limit,
        },
      });

      // Xử lý kết quả
      const hits = result.hits?.hits || [];
      const total = typeof result.hits?.total === 'object' ? result.hits.total.value : result.hits.total;

      return {
        data: hits.map(hit => hit._source),
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm trên Elasticsearch:', error);
      throw new Error('Không thể tìm kiếm sản phẩm');
    }
  }
  async getAllProducts(page: number, limit: number) {
    const [products, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ["productDetails", "category"],
    });

    // ✅ Lấy hình ảnh và tính totalSold cho từng sản phẩm
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await this.fileService.findFilesByTarget(product.id, "product");
        const totalSold = product.productDetails.reduce((sum, detail) => sum + detail.sold, 0);

        return {
          id: product.id,
          name: product.name,
          originalPrice: product.originalPrice,
          finalPrice: product.finalPrice,
          category: product.category,
          images: images.map((img) => img.fileUrl),
          totalSold, // Thêm totalSold vào object trả về
        };
      })
    );

    // ✅ Sắp xếp sản phẩm theo totalSold giảm dần
    productsWithImages.sort((a, b) => b.totalSold - a.totalSold);

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
      relations: ["productDetails", "category"]
    });

    if (!product) {
      throw new NotFoundException("Sản phẩm không tồn tại!");
    }

    const images = await this.fileService.findFilesByTarget(id, "product");

    const totalStock = product.productDetails.reduce((sum, detail) => sum + detail.stock, 0);
    const totalSold = product.productDetails.reduce((sum, detail) => sum + detail.sold, 0);

    const formattedImages = await Promise.all(
      images.map(async (image) => {
        // Lấy URL của ảnh từ Minio
        const fileUrl = await this.minioService.getUrlByName(image.bucketName, [
          image.fileName,
        ]);

        return {
          fileId: image.fileId,
          fileName: image.fileName,
          fileUrl: fileUrl[0], // Giả sử getUrlByName trả về mảng, lấy URL đầu tiên
          bucketName: image.bucketName,
        };
      })
    );

    return {
      ...product,
      images: formattedImages,
      totalStock,
      totalSold,
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

    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) throw new BadRequestException("Danh mục không tồn tại!");
      product.category = category;
    }

    if (updateProductDto.strategySaleIds) {
      const strategySales = await this.strategySaleRepository.find({
        where: { id: In(updateProductDto.strategySaleIds) },
      });

      if (!strategySales.length) throw new BadRequestException("Chiến lược giảm giá không tồn tại!");

      // Chuyển đổi strategySales thành ProductStrategySale[]
      product.productStrategySales = strategySales.map(strategySale => ({
        product,
        strategySale,
      })) as any; // Ép kiểu tránh lỗi TypeScript
    }
    product.originalPrice = updateProductDto.originalPrice;
    product.name = updateProductDto.name;
    await this.productRepository.save(product);

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
    await this.syncProductToElasticsearch(product);
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
    await this.elasticsearchService.getClient().delete({
      index: 'products',
      id: id.toString(),
    });
    return { message: "Sản phẩm đã được xóa thành công!" };
  }
  async syncProductToElasticsearch(product: Product) {
    const productDetails = await this.productDetailsRepository.find({ where: { product: { id: product.id } } });
    const totalSold = productDetails.reduce((sum, detail) => sum + (detail.sold || 0), 0);

    try {
      await this.elasticsearchService.getClient().index({
        index: 'products',
        id: product.id.toString(),
        document: { // Sử dụng `document` thay vì `body` cho phiên bản mới
          id: product.id,
          name: product.name || '',
          originalPrice: product.originalPrice || 0,
          finalPrice: product.finalPrice || 0,
          categoryId: product.category?.id || null,
          categoryName: product.category?.name || '',
          totalSold,
          materials: productDetails.map(detail => detail.material).filter(Boolean),
          sizes: productDetails.map(detail => detail.size).filter(Boolean),
        },
      });
      console.log(`Đã đồng bộ sản phẩm ${product.id} lên Elasticsearch`);
    } catch (error) {
      console.error(`Lỗi khi đồng bộ sản phẩm ${product.id} lên Elasticsearch:`, error);
      throw new Error('Không thể đồng bộ sản phẩm lên Elasticsearch');
    }
  }
}
