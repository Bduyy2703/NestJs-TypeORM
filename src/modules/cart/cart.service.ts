// async checkout(orderItems: { productDetailId: number; quantity: number }[]) {
//     for (const item of orderItems) {
//       const productDetail = await this.productDetailRepository.findOne({ where: { id: item.productDetailId } });
  
//       if (!productDetail) throw new NotFoundException(`Không tìm thấy sản phẩm ${item.productDetailId}`);
//       if (productDetail.stock < item.quantity) throw new BadRequestException(`Sản phẩm ${item.productDetailId} không đủ số lượng`);
  
//       productDetail.stock -= item.quantity;
//       productDetail.sold += item.quantity;
//       await this.productDetailRepository.save(productDetail);
//     }
  
//     return { message: 'Đặt hàng thành công', orderDetails: orderItems };
//   }
  