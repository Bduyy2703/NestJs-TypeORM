import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
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
import { SuggestProductDto } from "./dto/suggestProducts.dto";
import { SearchPhraseSuggestOption } from "@elastic/elasticsearch/lib/api/types";

@Injectable()
export class ProductService implements OnModuleInit {
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
  async onModuleInit() {
    try {
      await this.syncProductsToElasticsearch();
      console.log('Đồng bộ sản phẩm khi khởi động hoàn tất');
    } catch (error) {
      console.error('Lỗi khi đồng bộ sản phẩm lúc khởi động:', error);
    }
  }

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
  }


  // async searchProducts(searchDto: SearchProductDto) {
  //   const { keyword, categoryIds, priceMin, priceMax, sortBy, page = 1, limit = 10 } = searchDto;

  //   let sort: any[] = [];
  //   if (sortBy) {
  //     const [field, direction] = sortBy.split('.');
  //     if (['finalPrice', 'totalSold', 'name'].includes(field) && ['asc', 'desc'].includes(direction)) {
  //       sort.push({ [field]: direction });
  //     } else {
  //       sort.push({ finalPrice: 'asc' });
  //     }
  //   } else {
  //     sort.push({ finalPrice: 'asc' });
  //   }

  //   const query: any = {
  //     bool: {
  //       filter: [],
  //     },
  //   };

  //   if (keyword) {
  //     const keywords = keyword.trim().split(/\s+/).filter((kw) => kw.length >= 2);
  //     const numKeywords = keywords.length;

  //     query.bool.should = [];
  //     query.bool.minimum_should_match = 1;

  //     // 1. Khớp chính xác 100% (giữ nguyên dấu, sử dụng name.keyword)
  //     query.bool.should.push({
  //       bool: {
  //         filter: [
  //           {
  //             match: {
  //               'name.keyword': {
  //                 query: keyword,
  //                 boost: 100,
  //               },
  //             },
  //           },
  //         ],
  //       },
  //     });

  //     // 2. Khớp sai dấu (sử dụng name với vi_analyzer)
  //     if (numKeywords > 0) {
  //       query.bool.should.push({
  //         bool: {
  //           must: keywords.map((kw) => ({
  //             match: {
  //               name: {
  //                 query: kw,
  //                 boost: 50,
  //               },
  //             },
  //           })),
  //         },
  //       });
  //     }

  //     // 3. Khớp sai chính tả (giới hạn fuzziness tối đa 20%)
  //     if (numKeywords > 0) {
  //       query.bool.should.push({
  //         bool: {
  //           must: keywords.map((kw) => {
  //             const maxEditDistance = Math.max(1, Math.floor(kw.length * 0.2));
  //             return {
  //               match: {
  //                 name: {
  //                   query: kw,
  //                   fuzziness: maxEditDistance <= 2 ? maxEditDistance : 2,
  //                   boost: 10,
  //                 },
  //               },
  //             };
  //           }),
  //         },
  //       });
  //     }
  //   } else {
  //     query.bool.must = [{ match_all: {} }]; // Lấy tất cả sản phẩm
  //   }

  //   if (categoryIds?.length) {
  //     query.bool.filter.push({
  //       terms: { categoryId: categoryIds },
  //     });
  //   }

  //   if (priceMin != null || priceMax != null) {
  //     query.bool.filter.push({
  //       range: {
  //         finalPrice: {
  //           gte: priceMin ?? 0,
  //           lte: priceMax ?? Number.MAX_SAFE_INTEGER,
  //         },
  //       },
  //     });
  //   }

  //   try {
  //     const client = this.elasticsearchService.getClient();
  //     console.log('Truy vấn Elasticsearch:', JSON.stringify({
  //       index: 'products',
  //       body: { query, sort, from: (page - 1) * limit, size: limit, highlight: { fields: { name: {} } } },
  //     }, null, 2));

  //     const result = await client.search({
  //       index: 'products',
  //       body: {
  //         query,
  //         sort,
  //         from: (page - 1) * limit,
  //         size: limit,
  //         highlight: {
  //           fields: {
  //             name: {},
  //           },
  //         },
  //       },
  //     });

  //     const hits = result.hits?.hits || [];
  //     const total = typeof result.hits?.total === 'object' ? result.hits.total.value : result.hits.total;

  //     const response: any = {
  //       data: hits.map((hit) => {
  //         const source = hit._source as Record<string, any>;
  //         delete source.name_completion;
  //         if (hit.highlight?.name) {
  //           source.highlightedName = hit.highlight.name[0];
  //         }
  //         return source;
  //       }),
  //       total,
  //       page,
  //       limit,
  //     };

  //     if (hits.length === 0) {
  //       response.message = 'Không tìm thấy sản phẩm tương ứng';
  //     }

  //     return response;
  //   } catch (error) {
  //     console.error('Lỗi khi tìm kiếm sản phẩm:', JSON.stringify(error, null, 4));
  //     throw new Error(`Không thể tìm kiếm sản phẩm: ${(error as any).message}`);
  //   }
  // }
  async searchProducts(searchDto: SearchProductDto) {
    const { keyword, categoryIds, priceMin, priceMax, sortBy, page = 1, limit = 10 } = searchDto;

    let sort: any[] = [];
    if (sortBy) {
      const [field, direction] = sortBy.split('.');
      if (['finalPrice', 'totalSold', 'name'].includes(field) && ['asc', 'desc'].includes(direction)) {
        sort.push({ [field]: direction });
      } else {
        sort.push({ finalPrice: 'asc' });
      }
    } else {
      sort.push({ finalPrice: 'asc' });
    }

    const query: any = {
      bool: {
        filter: [],
      },
    };

    if (keyword) {
      const keywords = keyword.trim().split(/\s+/).filter((kw) => kw.length >= 2);
      const numKeywords = keywords.length;

      query.bool.should = [];
      query.bool.minimum_should_match = 1;

      // 1. Khớp chính xác 100% (giữ nguyên dấu, sử dụng name.keyword)
      query.bool.should.push({
        bool: {
          filter: [
            {
              match: {
                'name.keyword': {
                  query: keyword,
                  boost: 100,
                },
              },
            },
          ],
        },
      });

      // 2. Khớp sai dấu (sử dụng name với vi_analyzer)
      if (numKeywords > 0) {
        query.bool.should.push({
          bool: {
            must: keywords.map((kw) => ({
              match: {
                name: {
                  query: kw,
                  boost: 50,
                },
              },
            })),
          },
        });
      }

      // 3. Khớp sai chính tả (giới hạn fuzziness tối đa 20%)
      if (numKeywords > 0) {
        query.bool.should.push({
          bool: {
            must: keywords
              .filter((kw) => kw.length >= 3) // Bỏ fuzziness cho từ ngắn
              .map((kw) => {
                const maxEditDistance = Math.max(1, Math.floor(kw.length * 0.2));
                return {
                  match: {
                    name: {
                      query: kw,
                      fuzziness: maxEditDistance <= 2 ? maxEditDistance : 2,
                      boost: 10,
                    },
                  },
                };
              }),
          },
        });
      }
    } else {
      query.bool.must = [{ match_all: {} }];
    }

    if (categoryIds?.length) {
      query.bool.filter.push({
        terms: { categoryId: categoryIds },
      });
    }

    if (priceMin != null || priceMax != null) {
      query.bool.filter.push({
        range: {
          finalPrice: {
            gte: priceMin ?? 0,
            lte: priceMax ?? Number.MAX_SAFE_INTEGER,
          },
        },
      });
    }

    try {
      const client = this.elasticsearchService.getClient();
      console.log('Truy vấn Elasticsearch:', JSON.stringify({
        index: 'products',
        body: { query, sort, from: (page - 1) * limit, size: limit, highlight: keyword ? { fields: { name: {} } } : undefined },
      }, null, 2));

      const result = await client.search({
        index: 'products',
        body: {
          query,
          sort,
          from: (page - 1) * limit,
          size: limit,
          ...(keyword ? { highlight: { fields: { name: {} } } } : {}),
        },
      });

      const hits = result.hits?.hits || [];
      const total = typeof result.hits?.total === 'object' ? result.hits.total.value : result.hits.total;

      const response: any = {
        data: hits.map((hit) => {
          const source = hit._source as Record<string, any>;
          delete source.name_completion;
          if (hit.highlight?.name) {
            source.highlightedName = hit.highlight.name[0];
          }
          return source;
        }),
        total,
        page,
        limit,
      };

      if (hits.length === 0) {
        response.message = 'Không tìm thấy sản phẩm tương ứng';
      }

      return response;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', JSON.stringify(error, null, 4));
      throw new Error(`Không thể tìm kiếm sản phẩm: ${(error as any).message}`);
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
  async syncProductsToElasticsearch() {
    const products = await this.productRepository.find({ relations: ['category', 'productDetails'] });
    const client = this.elasticsearchService.getClient();

    const body = await Promise.all(
      products.map(async (product) => {
        const totalSold = product.productDetails.reduce((sum, detail) => sum + detail.sold, 0);
        const images = await this.fileService.findFilesByTarget(product.id, 'product');
        return [
          { index: { _index: 'products', _id: product.id.toString() } },
          {
            id: product.id,
            name: product.name,
            originalPrice: parseFloat(product.originalPrice.toString()),
            finalPrice: parseFloat(product.finalPrice.toString()),
            categoryId: product.category?.id || 0,
            categoryName: product.category?.name || '',
            totalSold: totalSold || 0,
            images: images.map((img) => img.fileUrl),
            name_completion: product.name, // Thêm cho completion suggester
          },
        ];
      }),
    );

    const flattenedBody = body.flat();

    if (flattenedBody.length > 0) {
      try {
        const bulkResponse = await client.bulk({ body: flattenedBody });
        if (bulkResponse.errors) {
          console.error('Lỗi khi đồng bộ sản phẩm:', JSON.stringify(bulkResponse.errors, null, 4));
          throw new Error('Không thể đồng bộ sản phẩm vào Elasticsearch');
        }
        console.log(`Đã đồng bộ ${products.length} sản phẩm vào Elasticsearch`);
      } catch (error) {
        console.error('Lỗi khi đồng bộ sản phẩm:', JSON.stringify(error, null, 4));
        throw new Error('Không thể đồng bộ sản phẩm vào Elasticsearch');
      }
    } else {
      console.log('Không có sản phẩm để đồng bộ');
    }
  }

  async syncProductToElasticsearch(product: Product) {
    const client = this.elasticsearchService.getClient();
    const productWithDetails = await this.productRepository.findOne({
      where: { id: product.id },
      relations: ['category', 'productDetails'],
    });

    if (!productWithDetails) {
      throw new NotFoundException('Sản phẩm không tồn tại!');
    }

    const totalSold = productWithDetails.productDetails.reduce((sum, detail) => sum + detail.sold, 0);
    const images = await this.fileService.findFilesByTarget(product.id, 'product');

    try {
      await client.index({
        index: 'products',
        id: product.id.toString(),
        body: {
          id: product.id,
          name: product.name,
          originalPrice: parseFloat(product.originalPrice.toString()),
          finalPrice: parseFloat(product.finalPrice.toString()),
          categoryId: productWithDetails.category?.id || 0,
          categoryName: productWithDetails.category?.name || '',
          totalSold: totalSold || 0,
          images: images.map((img) => img.fileUrl),
          name_completion: product.name, // Thêm cho completion suggester
        },
      });
      console.log(`Đã đồng bộ sản phẩm ID ${product.id} vào Elasticsearch`);
    } catch (error) {
      console.error(`Lỗi khi đồng bộ sản phẩm ID ${product.id}:`, JSON.stringify(error, null, 4));
      throw new Error(`Không thể đồng bộ sản phẩm ID ${product.id}`);
    }
  }
  async suggestProducts(suggestDto: SuggestProductDto) {
    const { keyword } = suggestDto;

    if (!keyword) {
      return { suggestions: [] };
    }

    try {
      const client = this.elasticsearchService.getClient();
      const result = await client.search({
        index: 'products',
        body: {
          suggest: {
            product_suggest: {
              prefix: keyword,
              completion: {
                field: 'name.completion',
                skip_duplicates: true,
                size: 5,
              },
            },
          },
        },
      });

      const options = result.suggest.product_suggest[0].options;
      const suggestions = Array.isArray(options)
        ? options.map(option => ({
          id: option._id,
          name: option.text,
          image: option._source?.images?.[0] || null,
        }))
        : [];


      return { suggestions };
    } catch (error) {
      console.error('Lỗi khi gợi ý sản phẩm:', JSON.stringify(error, null, 4));
      throw new Error(`Không thể gợi ý sản phẩm: ${(error as any).message}`);
    }
  }
}
