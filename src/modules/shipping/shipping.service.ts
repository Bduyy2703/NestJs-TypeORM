import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Discount } from "../discount/entity/discount.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";

@Injectable()
export class ShippingService {
    constructor(
        @InjectRepository(Discount)
        private discountRepo: Repository<Discount>,
        @InjectRepository(ProductDetails)
        private productDetailRepo: Repository<ProductDetails>
    ) { }

    async calculateShippingFee(
        checkoutItems: { productDetailId: number; name: string; quantity: number; price: string; totalPrice: number }[],
        totalAmount: number,
        address: { id?: number; street: string; city: string; country: string }
    ): Promise<any> {
        const toDistrictId = this.mapCityToDistrictId(address.city);
        const toWardCode = this.mapStreetToWardCode(address.street, address.city);

        // Nhóm sản phẩm theo kho và tính tổng trọng lượng, kích thước
        const shippingFees: { inventoryId: number; fee: number; fromLocation: string }[] = [];
        const inventoryMap = new Map<
            number,
            { items: any[]; totalWeight: number; maxLength: number; maxWidth: number; maxHeight: number; location: string }
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
            const weight = (productDetail.weight || 50) * item.quantity; // Mặc định 50g nếu không có dữ liệu
            const length = productDetail.length || 20; // Mặc định 20cm nếu không có
            const width = productDetail.width || 15; // Mặc định 15cm
            const height = productDetail.height || 10; // Mặc định 10cm

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
            inventoryData.items.push(item);
            inventoryData.totalWeight += weight;
            inventoryData.maxLength = Math.max(inventoryData.maxLength, length);
            inventoryData.maxWidth = Math.max(inventoryData.maxWidth, width);
            inventoryData.maxHeight = Math.max(inventoryData.maxHeight, height);
        }

        // Tính phí ship cho từng kho
        for (const [inventoryId, { totalWeight, maxLength, maxWidth, maxHeight, location }] of inventoryMap) {
            const { districtId: fromDistrictId, wardCode: fromWardCode } = this.parseInventoryLocation(location);

            const shippingParams = {
                from_district_id: fromDistrictId,
                from_ward_code: fromWardCode,
                to_district_id: toDistrictId,
                to_ward_code: toWardCode,
                service_type_id: 2, // Dịch vụ tiêu chuẩn
                weight: Math.round(totalWeight), // Làm tròn trọng lượng
                length: Math.round(maxLength), // Lấy kích thước lớn nhất
                width: Math.round(maxWidth),
                height: Math.round(maxHeight),
            };

            const fee = await this.getShippingFeeFromGHN(shippingParams);
            shippingFees.push({ inventoryId, fee, fromLocation: location });
        }

        // Tổng phí ship
        const totalShippingFee = shippingFees.reduce((sum, { fee }) => sum + fee, 0);

        return {
            message: "Tính phí giao hàng thành công",
            shippingFee: totalShippingFee,
            totalAmount,
            finalTotal: totalAmount + totalShippingFee,
            selectedAddress: address,
            shippingDetails: shippingFees,
        };
    }

    async getShippingFeeFromGHN(params: any): Promise<number> {
        const response = await fetch("https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee", {
            method: "POST",
            headers: {
                "Token": "YOUR_GHN_API_TOKEN",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });
        const data = await response.json();
        if (data.code !== 200) {
            throw new BadRequestException("Không thể tính phí giao hàng");
        }
        return data.data.total;
    }

    mapCityToDistrictId(city: string): number {
        return city === "Hà Nội" ? 1488 : 1444; // Giả định
    }

    mapStreetToWardCode(street: string, city: string): string {
        return "1A0101"; // Giả định
    }

    parseInventoryLocation(location: string): { districtId: number; wardCode: string } {
        const parts = location.split(", ");
        const city = parts[parts.length - 1].trim();
        if (city === "Hà Nội") {
            return { districtId: 1488, wardCode: "1A0101" };
        } else if (city === "TpHCM") {
            return { districtId: 1444, wardCode: "1A0101" };
        } else {
            throw new BadRequestException(`Không thể ánh xạ địa chỉ kho: ${location}`);
        }
    }

    async applyDiscount(
        checkoutItems: { productDetailId: number; name: string; quantity: number; price: string; totalPrice: number }[],
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
            if (!discount || (discount.endDate && discount.endDate < new Date()) || discount.quantity <= 0) {
                throw new BadRequestException(`Mã giảm giá ${discountCode} không hợp lệ hoặc đã hết hạn`);
            }

            let appliedDiscountValue = 0;
            if (discount.discountType === "FIXED") {
                appliedDiscountValue = discount.discountValue;
            } else if (discount.discountType === "PERCENTAGE") {
                appliedDiscountValue =
                    discount.condition === "SHIPPING"
                        ? (shippingFee * discount.discountValue) / 100
                        : (totalAmount * discount.discountValue) / 100;
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
                throw new BadRequestException(`Không thể áp dụng mã ${discountCode}: Đã dùng mã cho ${discount.condition === "SHIPPING" ? "ship" : "tổng tiền"}`);
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
}