async createProduct(createProductDto: CreateProductDto) {
    const { categoryId, inventoryId, strategySaleId, productDetails } = createProductDto;
  
    // ✅ Kiểm tra Inventory trước
    const inventory = await this.inventoryRepository.findOne({ where: { id: inventoryId } });
    if (!inventory) {
      throw new NotFoundException("Kho hàng không tồn tại!");
    }
  
    // ✅ Kiểm tra Category (nếu có)
    let category = null;
    if (categoryId) {
      category = await this.categoryRepository.findOne({ where: { id: categoryId } });
      if (!category) throw new NotFoundException("Danh mục không tồn tại!");
    }
  
    // ✅ Kiểm tra StrategySale (nếu có)
    let strategySale = null;
    if (strategySaleId) {
      strategySale = await this.strategySaleRepository.findOne({ where: { id: strategySaleId } });
      if (!strategySale) throw new NotFoundException("Chiến lược giảm giá không tồn tại!");
    }
  
    // ✅ Tạo sản phẩm
    const product = this.productRepository.create({
      ...createProductDto,
      category,
      inventory,
      strategySale,
    });
  
    await this.productRepository.save(product);
    return product;
  }
  