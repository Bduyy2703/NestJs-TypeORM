// async calculateShippingFee(
//     userId: string,
//     checkoutItems: { productId: number; name: string; quantity: number; price: string; totalPrice: number }[],
//     totalAmount: number,
//     address: { id?: number; street: string; city: string; country: string },
//     discountCode?: string // Mã giảm giá (nếu có)
//   ) {
//     // Tính phí ship (giữ nguyên logic GHN)
//     const fromDistrictId = 1444; // Kho mặc định
//     const toDistrictId = this.mapCityToDistrictId(address.city);
//     const toWardCode = this.mapStreetToWardCode(address.street, address.city);
//     const totalWeight = checkoutItems.reduce((sum, item) => sum + item.quantity * 50, 0);
  
//     const shippingParams = {
//       from_district_id: fromDistrictId,
//       to_district_id: toDistrictId,
//       to_ward_code: toWardCode,
//       service_type_id: 2,
//       weight: totalWeight,
//       length: 20,
//       width: 15,
//       height: 10,
//     };
  
//     const shippingFee = await this.getShippingFeeFromGHN(shippingParams);
  
//     let shippingFeeAfterDiscount = shippingFee;
//     let discountAmount = 0;
  
//     // Xử lý mã giảm giá nếu có
//     if (discountCode) {
//       const discount = await this.discountRepo.findOne({ where: { name: discountCode, isActive: true } });
//       if (!discount || (discount.endDate && discount.endDate < new Date()) || discount.quantity <= 0) {
//         throw new BadRequestException("Mã giảm giá không hợp lệ hoặc đã hết hạn");
//       }
  
//       // Tính giá trị giảm giá
//       let appliedDiscountValue = 0;
//       if (discount.discountType === "FIXED") {
//         appliedDiscountValue = discount.discountValue;
//       } else if (discount.discountType === "PERCENTAGE") {
//         // Tính phần trăm dựa trên loại giảm giá
//         if (discount.condition === "SHIPPING") {
//           appliedDiscountValue = (shippingFee * discount.discountValue) / 100;
//         } else {
//           appliedDiscountValue = (totalAmount * discount.discountValue) / 100;
//         }
//       }
  
//       // Áp dụng giảm giá
//       if (discount.condition === "SHIPPING") {
//         shippingFeeAfterDiscount = Math.max(0, shippingFee - appliedDiscountValue);
//       } else {
//         discountAmount = appliedDiscountValue;
//       }
  
//       // Giảm số lượng mã giảm giá (nếu cần)
//       discount.quantity -= 1;
//       await this.discountRepo.save(discount);
//     }
  
//     const finalTotal = (totalAmount - discountAmount) + shippingFeeAfterDiscount;
  
//     return {
//       message: "Tính phí giao hàng thành công",
//       shippingFee,              // Phí ship gốc
//       shippingFeeAfterDiscount, // Phí ship sau giảm giá
//       discountAmount,           // Số tiền giảm giá cho tổng hóa đơn
//       totalAmount,              // Tổng tiền sản phẩm
//       finalTotal,               // Tổng tiền cuối cùng
//       selectedAddress: address,
//     };
//   }
  
//   // Hàm gọi API GHN (giữ nguyên)
//   async getShippingFeeFromGHN(params: any): Promise<number> {
//     const response = await fetch("https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee", {
//       method: "POST",
//       headers: {
//         "Token": "YOUR_GHN_API_TOKEN",
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(params),
//     });
//     const data = await response.json();
//     if (data.code !== 200) {
//       throw new BadRequestException("Không thể tính phí giao hàng");
//     }
//     return data.data.total;
//   }
  
//   // Hàm ánh xạ (giữ nguyên)
//   mapCityToDistrictId(city: string): number {
//     return city === "Hà Nội" ? 1488 : 1444;
//   }
  
//   mapStreetToWardCode(street: string, city: string): string {
//     return "1A0101";
//   }