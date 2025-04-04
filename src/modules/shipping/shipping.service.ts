import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { Discount } from "../discount/entity/discount.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { Address } from "../address/entity/address.entity";

@Injectable()
export class ShippingService {
    private readonly ghnToken = "be5cc750-1074-11f0-95d0-0a92b8726859";
    private readonly ghnShopId = "196319";
    //clientId =  2509722 
    constructor(
        @InjectRepository(Discount)
        private discountRepo: Repository<Discount>,
        @InjectRepository(ProductDetails)
        private productDetailRepo: Repository<ProductDetails>,
        @InjectRepository(Address)
        private addressRepo: Repository<Address>

    ) { }

    async calculateShippingFee(
        checkoutItems: { productDetailId: number; quantity: number }[], // Chỉ giữ productDetailId và quantity
        totalAmount: number,
        address: { id?: number; street: string; city: string; country: string }
    ): Promise<any> {
        // Bước 1: Xác định địa chỉ giao hàng (giữ nguyên logic đã sửa trước đó)
        let toDistrict: { districtId: number; districtName: string };
        let toWardCode: string;
        let finalAddress = address; // Địa chỉ cuối cùng để trả về trong output

        if (address.id) {
            // Nếu có id, tìm địa chỉ trong database
            const savedAddress = await this.addressRepo.findOne({ where: { id: address.id } });
            if (!savedAddress) {
                throw new BadRequestException(`Không tìm thấy địa chỉ với id: ${address.id}`);
            }
            // Dùng thông tin từ địa chỉ đã lưu để tiếp tục logic
            finalAddress = {
                id: savedAddress.id,
                street: savedAddress.street,
                city: savedAddress.city,
                country: savedAddress.country,
            };
            toDistrict = await this.getDistrictFromCity(savedAddress.city);
            toWardCode = await this.getWardCodeFromStreet(savedAddress.street, toDistrict.districtId);
        } else {
            // Nếu không có id, dùng địa chỉ mới (logic hiện tại)
            toDistrict = await this.getDistrictFromCity(address.city);
            toWardCode = await this.getWardCodeFromStreet(address.street, toDistrict.districtId);
        }

        // Bước 2: Nhóm sản phẩm theo kho (tối ưu logic với checkoutItems)
        const shippingFees: { inventoryId: number; fee: number; fromLocation: string }[] = [];
        const inventoryMap = new Map<
            number,
            {
                items: any[];
                totalWeight: number;
                maxLength: number;
                maxWidth: number;
                maxHeight: number;
                location: string;
            }
        >();

        for (const item of checkoutItems) {
            const productDetail = await this.productDetailRepo.findOne({
                where: { id: item.productDetailId },
                relations: ["inventory"],
            });
            if (!productDetail || !productDetail.inventory) {
                throw new BadRequestException(`Không tìm thấy kho cho biến thể ${item.productDetailId}`);
            }

            const inventoryId = productDetail.inventory.id;
            const weight = (productDetail.weight || 50) * item.quantity;
            const length = productDetail.length || 20;
            const width = productDetail.width || 15;
            const height = productDetail.height || 10;

            if (!inventoryMap.has(inventoryId)) {
                inventoryMap.set(inventoryId, {
                    items: [],
                    totalWeight: 0,
                    maxLength: 0,
                    maxWidth: 0,
                    maxHeight: 0,
                    location: productDetail.inventory.location,
                });
            }
            const inventoryData = inventoryMap.get(inventoryId)!;
            inventoryData.items.push({
                productDetailId: item.productDetailId, // Chỉ lưu productDetailId
                quantity: item.quantity, // Lưu quantity
                weight: productDetail.weight || 1,
                length: productDetail.length || 1,
                width: productDetail.width || 1,
                height: productDetail.height || 1,
            });
            inventoryData.totalWeight += weight;
            inventoryData.maxLength = Math.max(inventoryData.maxLength, length);
            inventoryData.maxWidth = Math.max(inventoryData.maxWidth, width);
            inventoryData.maxHeight = Math.max(inventoryData.maxHeight, height);
        }

        for (const [inventoryId, { items, totalWeight, maxLength, maxWidth, maxHeight, location }] of inventoryMap) {
            const fromDistrict = await this.getDistrictFromCity(this.extractCityFromLocation(location));
            const fromWardCode = await this.getWardCodeFromStreet(location, fromDistrict.districtId);

            const service = await this.getAvailableServices(fromDistrict.districtId, toDistrict.districtId);
            if (!service) {
                throw new BadRequestException("Không tìm thấy dịch vụ giao hàng phù hợp");
            }

            const shippingParams = {
                from_district_id: fromDistrict.districtId,
                from_ward_code: fromWardCode,
                to_district_id: toDistrict.districtId,
                to_ward_code: toWardCode,
                service_id: service.service_id,
                service_type_id: null,
                weight: Math.round(totalWeight),
                length: Math.round(maxLength),
                width: Math.round(maxWidth),
                height: Math.round(maxHeight),
                insurance_value: totalAmount,
                cod_failed_amount: 2000,
                coupon: null,
                items: items.map((item) => ({
                    name: `Sản phẩm ${item.productDetailId}`,
                    quantity: item.quantity,
                    height: item.height,
                    weight: item.weight,
                    length: item.length,
                    width: item.width,
                })),
            };

            const fee = await this.getShippingFeeFromGHN(shippingParams);
            shippingFees.push({ inventoryId, fee, fromLocation: location });
        }
        const totalShippingFee = shippingFees.reduce((sum, { fee }) => sum + fee, 0);

        return {
            message: "Tính phí giao hàng thành công",
            shippingFee: totalShippingFee,
            totalAmount,
            finalTotal: totalAmount + totalShippingFee,
            selectedAddress: finalAddress,
            shippingDetails: shippingFees,
        };
    }

    async getShippingFeeFromGHN(params: any): Promise<number> {
        console.log(params)
        const response = await fetch("https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee", {
            method: "POST",
            headers: {
                "token": this.ghnToken,
                "ShopId": this.ghnShopId,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });
        const data = await response.json();
        if (data.code !== 200) {
            throw new BadRequestException("Không thể tính phí giao hàng: " + data.message);
        }
        return data.data.total;
    }

    async getAvailableServices(fromDistrictId: number, toDistrictId: number): Promise<any> {
        const response = await fetch("https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services", {
            method: "POST",
            headers: {
                "token": this.ghnToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                shop_id: parseInt(this.ghnShopId),
                from_district: fromDistrictId,
                to_district: toDistrictId,
            }),
        });
        const data = await response.json();
        if (data.code !== 200 || !data.data || data.data.length === 0) {
            return null;
        }
        return data.data[0]; // Lấy dịch vụ đầu tiên (thường là dịch vụ tiêu chuẩn)
    }

    async getDistrictFromCity(city: string): Promise<{ districtId: number; districtName: string }> {
        // Lấy danh sách tỉnh/thành
        const provinceResponse = await fetch("https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province", {
            method: "GET",
            headers: {
                "token": this.ghnToken,
                "Content-Type": "application/json",
            },
        });
        const provinceData = await provinceResponse.json();
        if (provinceData.code !== 200) {
            throw new BadRequestException("Không thể lấy danh sách tỉnh/thành");
        }

        // Tạo map ánh xạ ProvinceID -> ProvinceName
        const provinceMap = new Map<number, string>();
        provinceData.data.forEach((province: any) => {
            provinceMap.set(province.ProvinceID, province.ProvinceName);
        });
        // Lấy danh sách quận/huyện
        const districtResponse = await fetch("https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district", {
            method: "GET",
            headers: {
                "token": this.ghnToken,
                "Content-Type": "application/json",
            },
        });
        const districtData = await districtResponse.json();
        if (districtData.code !== 200) {
            throw new BadRequestException("Không thể lấy danh sách quận/huyện");
        }

        if (!Array.isArray(districtData.data)) {
            throw new BadRequestException("Dữ liệu quận/huyện không hợp lệ");
        }

        // Chuẩn hóa chuỗi
        const normalizedCity = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // "Hà Nội" -> "ha noi"
        // Tìm district
        const district = districtData.data.find((d: any) => {
            const provinceName = provinceMap.get(d.ProvinceID) || "";
            const districtName = d.DistrictName || "";
            const normalizedProvinceName = provinceName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const normalizedDistrictName = districtName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalizedProvinceName.includes(normalizedCity) || normalizedDistrictName.includes(normalizedCity);
        });

        if (!district) {
            throw new BadRequestException(`Không tìm thấy district cho thành phố: ${city}`);
        }
        return { districtId: district.DistrictID, districtName: district.DistrictName };
    }

    async getWardCodeFromStreet(street: string, districtId: number): Promise<string> {
        const response = await fetch(`https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${districtId}`, {
            method: "GET",
            headers: {
                "token": this.ghnToken,
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        if (data.code !== 200) {
            throw new BadRequestException("Không thể lấy danh sách phường/xã");
        }
        const ward = data.data.find((w: any) => street.toLowerCase().includes(w.WardName.toLowerCase()));
        return ward ? ward.WardCode : data.data[0].WardCode;
    }

    extractCityFromLocation(location: string): string {
        const parts = location.split(", ");
        return parts[parts.length - 1].trim();
    }

    async applyDiscount(
        totalAmount: number,
        shippingFee: number,
        discountCodes: string[] // Danh sách mã giảm giá (tối đa 2: 1 ship + 1 total)
    ): Promise<any> {
        let shippingFeeAfterDiscount = shippingFee;
        let discountAmount = 0;
        let shippingDiscountApplied = false;
        let totalDiscountApplied = false;

        // Xử lý từng mã giảm giá
        for (const discountCode of discountCodes) {
            const discount = await this.discountRepo.findOne({ where: { name: discountCode, isActive: true } });
            const currentDate = new Date(); // Ngày hiện tại

            // Kiểm tra mã giảm giá có hợp lệ không
            if (!discount) {
                throw new BadRequestException(`Mã giảm giá ${discountCode} không tồn tại`);
            }
            if (!discount.isActive) {
                throw new BadRequestException(`Mã giảm giá ${discountCode} không hoạt động`);
            }
            if (discount.quantity <= 0) {
                throw new BadRequestException(`Mã giảm giá ${discountCode} đã hết số lượng`);
            }
            if (discount.startDate && discount.startDate > currentDate) {
                throw new BadRequestException(`Mã giảm giá ${discountCode} chưa đến ngày áp dụng (bắt đầu từ ${discount.startDate.toISOString()})`);
            }
            if (discount.endDate && discount.endDate < currentDate) {
                throw new BadRequestException(`Mã giảm giá ${discountCode} đã hết hạn (hết hạn vào ${discount.endDate.toISOString()})`);
            }

            // Chuyển đổi discountValue từ chuỗi thành số
            const discountValue = discount.discountValue;
            if (isNaN(discountValue)) {
                throw new BadRequestException(`Giá trị giảm giá của mã ${discountCode} không hợp lệ`);
            }

            let appliedDiscountValue = 0;
            if (discount.discountType === "FIXED") {
                appliedDiscountValue = discountValue;
            } else if (discount.discountType === "PERCENTAGE") {
                appliedDiscountValue =
                    discount.condition === "SHIPPING"
                        ? (shippingFee * discountValue) / 100
                        : (totalAmount * discountValue) / 100;
            }

            // Áp dụng giảm giá
            if (discount.condition === "SHIPPING" && !shippingDiscountApplied) {
                shippingFeeAfterDiscount = Math.max(0, shippingFee - appliedDiscountValue);
                shippingDiscountApplied = true;
                discount.quantity -= 1;
                await this.discountRepo.save(discount);
            } else if (discount.condition === "TOTAL" && !totalDiscountApplied) {
                discountAmount = appliedDiscountValue;
                totalDiscountApplied = true;
                discount.quantity -= 1;
                await this.discountRepo.save(discount);
            } else {
                throw new BadRequestException(`Không thể áp dụng mã ${discountCode}: Đã dùng mã cho ${discount.condition === "SHIPPING" ? "phí ship" : "tổng tiền"}`);
            }
        }

        const finalTotal = (totalAmount - discountAmount) + shippingFeeAfterDiscount;

        return {
            message: "Áp dụng mã giảm giá thành công",
            shippingFee,              // Phí ship gốc
            shippingFeeAfterDiscount, // Phí ship sau giảm giá
            discountAmount,           // Số tiền giảm giá cho tổng hóa đơn
            totalAmount,              // Tổng tiền sản phẩm
            finalTotal,               // Tổng tiền cuối cùng
        };
    }
    async getAvailableDiscounts(totalAmount: number, shippingFee: number) {
        const now = new Date();
    
        // Giới hạn giảm giá = 30% tổng tiền sản phẩm
        const maxDiscount = totalAmount * 0.3;
    
        // Query lấy mã giảm giá sản phẩm (TOTAL)
        const totalDiscountsQuery = this.discountRepo.createQueryBuilder("discount")
            .where("discount.isActive = :active", { active: true })
            .andWhere("discount.quantity > 0")
            .andWhere("discount.startDate <= :now", { now })
            .andWhere(new Brackets(qb => {
                qb.where("discount.endDate >= :now", { now })
                  .orWhere("discount.endDate IS NULL");
            }))
            .andWhere("discount.condition = 'TOTAL'") // Chỉ lấy mã áp dụng cho sản phẩm
            .andWhere(new Brackets(qb => {
                qb.where("discount.discountType = 'FIXED' AND discount.discountValue <= :maxDiscount", { maxDiscount })
                  .orWhere("discount.discountType = 'PERCENTAGE' AND (discount.discountValue / 100 * :totalAmount) <= :maxDiscount", { totalAmount, maxDiscount });
            }));
    
        // Query lấy mã giảm giá phí ship (SHIPPING) nếu có phí ship
        let shippingDiscountsQuery;
        if (shippingFee > 0) {
            shippingDiscountsQuery = this.discountRepo.createQueryBuilder("discount")
                .where("discount.isActive = :active", { active: true })
                .andWhere("discount.quantity > 0")
                .andWhere("discount.startDate <= :now", { now })
                .andWhere(new Brackets(qb => {
                    qb.where("discount.endDate >= :now", { now })
                      .orWhere("discount.endDate IS NULL");
                }))
                .andWhere("discount.condition = 'SHIPPING'"); // Chỉ lấy mã áp dụng cho phí ship
        }
    
        // Lấy danh sách mã giảm giá hợp lệ
        const totalDiscounts = await totalDiscountsQuery.getMany();
        const shippingDiscounts = shippingDiscountsQuery ? await shippingDiscountsQuery.getMany() : [];
    
        return [...totalDiscounts, ...shippingDiscounts]; // Gộp cả 2 loại giảm giá
    }
    
}


// GHTK
// import { Injectable, BadRequestException } from "@nestjs/common";
// import { InjectRepository } from "@nestjs/typeorm";
// import { Repository } from "typeorm";
// import { ProductDetails } from "src/modules/product-details/entity/productDetail.entity";

// @Injectable()
// export class ShippingService {
//   private readonly ghtkToken = process.env.GHTK_API_TOKEN || "your-test-token-here";

//   constructor(
//     @InjectRepository(ProductDetails)
//     private productDetailRepo: Repository<ProductDetails>
//   ) {}

//   async calculateShippingFee(
//     checkoutItems: { productDetailId: number; name: string; quantity: number; price: string; totalPrice: number }[],
//     totalAmount: number,
//     address: { id?: number; street: string; city: string; country: string }
//   ): Promise<any> {
//     const toProvince = address.city;
//     const toDistrict = await this.getDistrictFromCity(toProvince, "GHTK");

//     const shippingFees: { inventoryId: number; fee: number; fromLocation: string }[] = [];
//     const inventoryMap = new Map<
//       number,
//       { items: any[]; totalWeight: number; maxLength: number; maxWidth: number; maxHeight: number; location: string }
//     >();

//     for (const item of checkoutItems) {
//       const productDetail = await this.productDetailRepo.findOne({
//         where: { id: item.productDetailId },
//         relations: ["inventory"],
//       });
//       if (!productDetail || !productDetail.inventory) {
//         throw new BadRequestException(`Không tìm thấy kho cho biến thể ${item.productDetailId}`);
//       }

//       const inventoryId = productDetail.inventory.id;
//       const weight = (productDetail.weight || 50) * item.quantity;
//       const length = productDetail.length || 20;
//       const width = productDetail.width || 15;
//       const height = productDetail.height || 10;

//       if (!inventoryMap.has(inventoryId)) {
//         inventoryMap.set(inventoryId, {
//           items: [],
//           totalWeight: 0,
//           maxLength: 0,
//           maxWidth: 0,
//           maxHeight: 0,
//           location: productDetail.inventory.location,
//         });
//       }
//       const inventoryData = inventoryMap.get(inventoryId)!;
//       inventoryData.items.push(item);
//       inventoryData.totalWeight += weight;
//       inventoryData.maxLength = Math.max(inventoryData.maxLength, length);
//       inventoryData.maxWidth = Math.max(inventoryData.maxWidth, width);
//       inventoryData.maxHeight = Math.max(inventoryData.maxHeight, height);
//     }

//     for (const [inventoryId, { totalWeight, location }] of inventoryMap) {
//       const fromProvince = this.extractCityFromLocation(location);
//       const fromDistrict = await this.getDistrictFromCity(fromProvince, "GHTK");

//       const shippingParams = {
//         pick_province: fromProvince,
//         pick_district: fromDistrict.districtName,
//         province: toProvince,
//         district: toDistrict.districtName,
//         weight: Math.round(totalWeight),
//         value: totalAmount,
//         transport: "road",
//       };

//       const fee = await this.getShippingFeeFromGHTK(shippingParams);
//       shippingFees.push({ inventoryId, fee, fromLocation: location });
//     }

//     const totalShippingFee = shippingFees.reduce((sum, { fee }) => sum + fee, 0);

//     return {
//       message: "Tính phí giao hàng thành công",
//       shippingFee: totalShippingFee,
//       totalAmount,
//       finalTotal: totalAmount + totalShippingFee,
//       selectedAddress: address,
//       shippingDetails: shippingFees,
//     };
//   }

//   async getShippingFeeFromGHTK(params: any): Promise<number> {
//     const response = await fetch("https://services.giaohangtietkiem.vn/services/shipment/fee", {
//       method: "POST",
//       headers: {
//         "Token": this.ghtkToken,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(params),
//     });
//     const data = await response.json();
//     if (!data.success) {
//       throw new BadRequestException("Không thể tính phí giao hàng từ GHTK: " + data.message);
//     }
//     return data.fee;
//   }

//   async getDistrictFromCity(city: string, provider: string): Promise<{ districtId: number; districtName: string }> {
//     const response = await fetch("https://services.giaohangtietkiem.vn/services/shipment/district", {
//       headers: { "Token": this.ghtkToken },
//     });
//     const data = await response.json();
//     const district = data.data.find((d: any) => d.province_name === city || d.district_name.includes(city));
//     if (!district) {
//       throw new BadRequestException(`Không tìm thấy district cho thành phố: ${city}`);
//     }
//     return { districtId: district.district_id, districtName: district.district_name };
//   }

//   extractCityFromLocation(location: string): string {
//     const parts = location.split(", ");
//     return parts[parts.length - 1].trim();
//   }
// }