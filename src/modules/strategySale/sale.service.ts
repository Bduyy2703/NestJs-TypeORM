// async getProductWithDiscount(productId: number) {
//     const product = await this.productRepository.findOne({
//       where: { id: productId },
//       relations: ['strategySale'], // Lấy chiến lược giảm giá
//     });
  
//     if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");
  
//     let finalPrice = product.originalPrice;
  
//     // Kiểm tra xem sản phẩm có chiến lược giảm giá không
//     if (product.strategySale) {
//       const now = new Date();
//       const { discountPercentage, startDate, endDate } = product.strategySale;
  
//       // Nếu chiến lược giảm giá đang có hiệu lực, tính toán giá giảm
//       if (now >= startDate && now <= endDate) {
//         finalPrice = product.originalPrice * (1 - discountPercentage / 100);
//       }
//     }
  
//     return {
//       id: product.id,
//       name: product.name,
//       originalPrice: product.originalPrice,
//       finalPrice: finalPrice, // Giá có thể đã giảm
//       strategySale: product.strategySale ? product.strategySale.name : null,
//     };
//   }
  