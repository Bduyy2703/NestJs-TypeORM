import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, In } from "typeorm";
import { Invoice } from "./entity/invoice.entity";
import { InvoiceItem } from "./entity/invoiceItem.entity";
import { User } from "../users/entities/user.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { CreateInvoiceDto, InvoiceResponseDto, RevenueStatisticsDto, StatusStatisticsDto, TopProductStatisticsDto, TopCustomerStatisticsDto, PaymentMethodStatisticsDto, InvoiceCountStatisticsDto, PaymentMethod, InvoiceStatus, UpdateInvoiceStatusDto } from "./dto/invoice.dto";
import { Discount } from "../discount/entity/discount.entity";
import { InvoiceDiscount } from "./entity/invoice-discount.entity";

@Injectable()
export class InvoiceService {
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>,
        @InjectRepository(InvoiceItem)
        private invoiceItemRepo: Repository<InvoiceItem>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(ProductDetails)
        private productDetailRepo: Repository<ProductDetails>,
    ) {}

    // 1. Tạo invoice
    async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
        const invoice = this.invoiceRepo.create({
            userId: createInvoiceDto.userId,
            address: createInvoiceDto.address,
            paymentMethod: createInvoiceDto.paymentMethod,
            totalProductAmount: createInvoiceDto.totalProductAmount,
            shippingFee: createInvoiceDto.shippingFee,
            shippingFeeDiscount: createInvoiceDto.shippingFeeDiscount,
            productDiscount: createInvoiceDto.productDiscount,
            finalTotal: createInvoiceDto.finalTotal,
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await this.invoiceRepo.save(invoice);
        return this.mapToInvoiceResponseDto(invoice);
    }

    // Hàm mới: Cập nhật trạng thái hóa đơn
    async updateInvoiceStatus(id: number, updateInvoiceStatusDto: UpdateInvoiceStatusDto): Promise<InvoiceResponseDto> {
        // Tìm hóa đơn theo ID
        const invoice = await this.invoiceRepo.findOne({ where: { id } });
        if (!invoice) {
            throw new NotFoundException(`Hóa đơn với ID ${id} không tồn tại`);
        }

        // Cập nhật trạng thái
        invoice.status = updateInvoiceStatusDto.status;
        invoice.updatedAt = new Date();

        // Lưu thay đổi
        const updatedInvoice = await this.invoiceRepo.save(invoice);

        // Trả về DTO
        return this.mapToInvoiceResponseDto(updatedInvoice);
    }

    // 2. Lấy chi tiết 1 invoice theo ID
    async getInvoiceById(id: number): Promise<InvoiceResponseDto> {
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: ["user", "user.profile", "address", "items","discount","discount.discount", "items.productDetail", "items.productDetail.product"],
        });
        if (!invoice) {
            throw new NotFoundException(`Hóa đơn với ID ${id} không tồn tại`);
        }
        return this.mapToInvoiceResponseDto(invoice);
    }

    // 3. Lấy danh sách invoices theo userId
    async getInvoicesByUserId(userId: string): Promise<InvoiceResponseDto[]> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`Người dùng với ID ${userId} không tồn tại`);
        }

        const invoices = await this.invoiceRepo.find({
            where: { userId },
            relations: ["user", "user.profile", "address", "items", "discount", "discount.discount", "items.productDetail", "items.productDetail.product"],
            order: { createdAt: "DESC" },
        });

        return invoices.map(invoice => this.mapToInvoiceResponseDto(invoice));
    }

    // 4. Lấy danh sách tất cả invoices
    async getAllInvoices(): Promise<InvoiceResponseDto[]> {
        const invoices = await this.invoiceRepo.find({
            relations: ["user", "user.profile", "address", "items", "discount","items.productDetail","discount.discount", "items.productDetail.product"],
            order: { createdAt: "DESC" },
        });
        return invoices.map(invoice => this.mapToInvoiceResponseDto(invoice));
    }

    // 5. Thống kê doanh thu theo khoảng thời gian
    async getRevenueStatistics(startDate: string, endDate: string, onlyPaid: boolean = true): Promise<RevenueStatisticsDto> {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new BadRequestException("Định dạng ngày không hợp lệ (YYYY-MM-DD)");
        }
        if (start > end) {
            throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
        }
    
        const queryBuilder = this.invoiceRepo
            .createQueryBuilder("invoice")
            .select("SUM(invoice.finalTotal)", "totalRevenue")
            .addSelect("COUNT(invoice.id)", "totalInvoices")
            .where("invoice.createdAt BETWEEN :start AND :end", { start, end });
    
        if (onlyPaid) {
            queryBuilder.andWhere("invoice.status = :status", { status: "PAID" });
        }
    
        const result = await queryBuilder.getRawOne();
    
        return {
            totalRevenue: parseFloat(result.totalRevenue) || 0,
            totalInvoices: parseInt(result.totalInvoices) || 0,
            startDate,
            endDate,
        };
    }

    // 6. Thống kê số lượng hóa đơn theo trạng thái
    async getStatusStatistics(startDate: string, endDate: string): Promise<StatusStatisticsDto> {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new BadRequestException("Định dạng ngày không hợp lệ (YYYY-MM-DD)");
        }
        if (start > end) {
            throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
        }
    
        const result = await this.invoiceRepo
            .createQueryBuilder("invoice")
            .select("invoice.status", "status")
            .addSelect("COUNT(invoice.id)", "count")
            .where("invoice.createdAt BETWEEN :start AND :end", { start, end })
            .groupBy("invoice.status")
            .getRawMany();
    
        const allStatuses = Object.values(InvoiceStatus); // Lấy tất cả trạng thái từ enum
        const statistics = allStatuses.map(status => {
            const found = result.find(item => item.status === status);
            return {
                status,
                count: found ? parseInt(found.count) : 0,
            };
        });
    
        return {
            startDate,
            endDate,
            statistics,
        };
    }

    // 7. Thống kê sản phẩm bán chạy (fix Best selling product statistics)
    async getTopProducts(startDate: string, endDate: string, limit: number, onlyPaid: boolean = true): Promise<TopProductStatisticsDto[]> {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new BadRequestException("Định dạng ngày không hợp lệ (YYYY-MM-DD)");
        }
        if (start > end) {
            throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
        }
    
        const queryBuilder = this.invoiceItemRepo
            .createQueryBuilder("invoiceItem")
            .innerJoin("invoiceItem.invoice", "invoice")
            .innerJoin("invoiceItem.productDetail", "productDetail")
            .innerJoin("productDetail.product", "product")
            .select("productDetail.id", "productDetailId")
            .addSelect("product.name", "productName")
            .addSelect("SUM(invoiceItem.quantity)", "totalQuantity")
            .addSelect("SUM(invoiceItem.quantity * invoiceItem.price)", "totalRevenue")
            .where("invoice.createdAt BETWEEN :start AND :end", { start, end })
            .groupBy("productDetail.id")
            .addGroupBy("product.name")
            .orderBy("SUM(invoiceItem.quantity)", "DESC")
            .limit(limit);
    
        if (onlyPaid) {
            queryBuilder.andWhere("invoice.status = :status", { status: "PAID" });
        }
    
        const result = await queryBuilder.getRawMany();
    
        return result.map(item => ({
            productDetailId: item.productDetailId,
            productName: item.productName,
            totalQuantity: parseInt(item.totalQuantity),
            totalRevenue: parseFloat(item.totalRevenue),
        }));
    }

    // 8. Thống kê khách hàng chi tiêu nhiều nhất (fix and caculatormoney of userIduserId)
    async getTopCustomers(startDate: string, endDate: string, limit: number, onlyPaid: boolean = true): Promise<TopCustomerStatisticsDto[]> {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new BadRequestException("Định dạng ngày không hợp lệ (YYYY-MM-DD)");
        }
        if (start > end) {
            throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
        }
    
        const queryBuilder = this.invoiceRepo
            .createQueryBuilder("invoice")
            .innerJoin("invoice.user", "user")
            .select("user.id", "userId")
            .addSelect("user.username", "username")
            .addSelect("SUM(invoice.finalTotal)", "totalSpent")
            .addSelect("COUNT(invoice.id)", "totalInvoices")
            .where("invoice.createdAt BETWEEN :start AND :end", { start, end })
            .groupBy("user.id")
            .addGroupBy("user.username")
            .orderBy("SUM(invoice.finalTotal)", "DESC")
            .limit(limit);
    
        if (onlyPaid) {
            queryBuilder.andWhere("invoice.status = :status", { status: "PAID" });
        }
    
        const result = await queryBuilder.getRawMany();
    
        return result.map(item => ({
            userId: item.userId,
            username: item.username,
            totalSpent: parseFloat(item.totalSpent),
            totalInvoices: parseInt(item.totalInvoices),
        }));
    }

    // 9. Thống kê doanh thu theo phương thức thanh toán(fix get all statusstatus)
    async getPaymentMethodStatistics(startDate: string, endDate: string, onlyPaid: boolean = false): Promise<PaymentMethodStatisticsDto[]> {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new BadRequestException("Định dạng ngày không hợp lệ (YYYY-MM-DD)");
        }
        if (start > end) {
            throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
        }
    
        const queryBuilder = this.invoiceRepo
            .createQueryBuilder("invoice")
            .select("invoice.paymentMethod", "paymentMethod")
            .addSelect("invoice.status", "status")
            .addSelect("SUM(invoice.finalTotal)", "totalRevenue")
            .addSelect("COUNT(invoice.id)", "totalInvoices")
            .where("invoice.createdAt BETWEEN :start AND :end", { start, end })
            .groupBy("invoice.paymentMethod")
            .addGroupBy("invoice.status")
            .orderBy("invoice.paymentMethod", "ASC")
            .addOrderBy("invoice.status", "ASC");
    
        if (onlyPaid) {
            queryBuilder.andWhere("invoice.status = :status", { status: "PAID" });
        }
    
        const result = await queryBuilder.getRawMany();
    
        return result.map(item => ({
            paymentMethod: item.paymentMethod,
            status: item.status,
            totalRevenue: parseFloat(item.totalRevenue) || 0,
            totalInvoices: parseInt(item.totalInvoices) || 0,
        }));
    }

    // 10. Thống kê số lượng hóa đơn theo ngày/tháng
    async getInvoiceCountStatistics(type: 'daily' | 'monthly', year: number, month?: number): Promise<InvoiceCountStatisticsDto[]> {
        if (type === 'daily' && !month) {
            throw new BadRequestException("Tháng là bắt buộc khi thống kê theo ngày");
        }
    
        const query = this.invoiceRepo.createQueryBuilder("invoice");
        let result: any[];
    
        if (type === 'daily') {
            const start = new Date(year, month! - 1, 1);
            const end = new Date(year, month!, 0);
            query
                .select("TO_CHAR(invoice.createdAt, 'YYYY-MM-DD')", "date")
                .addSelect("COUNT(invoice.id)", "count")
                .where("invoice.createdAt BETWEEN :start AND :end", { start, end })
                .groupBy("TO_CHAR(invoice.createdAt, 'YYYY-MM-DD')")
                .orderBy("date", "ASC");
    
            result = await query.getRawMany();
    
            // Tạo danh sách tất cả các ngày trong tháng
            const daysInMonth = end.getDate();
            const allDays: InvoiceCountStatisticsDto[] = [];
            for (let day = 1; day <= daysInMonth; day++) {
                const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const found = result.find(item => item.date === date);
                allDays.push({
                    period: date,
                    count: found ? parseInt(found.count) : 0,
                });
            }
            return allDays;
        } else {
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31);
            query
                .select("EXTRACT(MONTH FROM invoice.createdAt)", "month")
                .addSelect("COUNT(invoice.id)", "count")
                .where("invoice.createdAt BETWEEN :start AND :end", { start, end })
                .groupBy("EXTRACT(MONTH FROM invoice.createdAt)")
                .orderBy("month", "ASC");
    
            result = await query.getRawMany();
    
            // Tạo danh sách tất cả các tháng (1-12)
            const allMonths: InvoiceCountStatisticsDto[] = [];
            for (let m = 1; m <= 12; m++) {
                const found = result.find(item => parseInt(item.month) === m);
                allMonths.push({
                    period: m.toString(),
                    count: found ? parseInt(found.count) : 0,
                });
            }
            return allMonths;
        }
    }

    private mapToInvoiceResponseDto(invoice: Invoice): InvoiceResponseDto {
        const paymentMethod = this.validatePaymentMethod(invoice.paymentMethod);
        const status = this.validateInvoiceStatus(invoice.status);

        return {
            id: invoice.id,
            userId: invoice.userId,
            user: invoice.user
                ? {
                      id: invoice.user.id,
                      username: invoice.user.username,
                      phoneNumber: invoice.user.profile?.phoneNumber || "N/A", // Sửa: Lấy phoneNumber từ user.profile
                  }
                : null,
            addressId: invoice.addressId,
            address: invoice.address
                ? {
                      id: invoice.address.id,
                      street: invoice.address.street,
                      city: invoice.address.city,
                      country: invoice.address.country,
                  }
                : null,
            paymentMethod: paymentMethod,
            totalProductAmount: invoice.totalProductAmount,
            shippingFee: invoice.shippingFee,
            shippingFeeDiscount: invoice.shippingFeeDiscount,
            productDiscount: invoice.productDiscount,
            finalTotal: invoice.finalTotal,
            status: status,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            items: invoice.items?.map(item => ({
                id: item.id,
                productDetailId: item.productDetailId,
                productDetail: item.productDetail
                    ? {
                          productDetailId: item.productDetail.id,
                          name: item.productDetail.product?.name || "Unknown Product",
                          price: item.productDetail.product?.finalPrice || 0,
                      }
                    : null,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.quantity * item.price,
            })) || [],
            discount: invoice.discount?.map(discountItem => ({
                id: discountItem.id,
                discountId: discountItem.discountId,
                discount: discountItem.discount
                    ? {
                          name: discountItem.discount.name,
                          condition: discountItem.discount.condition,
                          discountValue: +discountItem.discount.discountValue,
                          discountType: discountItem.discount.discountType,
                          quantity: discountItem.discount.quantity,
                          startDate: discountItem.discount.startDate,
                          endDate: discountItem.discount.endDate,
                      }
                    : null,
            })) || [],
        };
    }

    // Hàm kiểm tra và ép kiểu paymentMethod
    private validatePaymentMethod(paymentMethod: string): PaymentMethod {
        const validMethods = Object.values(PaymentMethod);
        if (!validMethods.includes(paymentMethod as PaymentMethod)) {
            throw new Error(`Phương thức thanh toán không hợp lệ: ${paymentMethod}`);
        }
        return paymentMethod as PaymentMethod;
    }

    // Hàm kiểm tra và ép kiểu status
    private validateInvoiceStatus(status: string): InvoiceStatus {
        const validStatuses = Object.values(InvoiceStatus);
        if (!validStatuses.includes(status as InvoiceStatus)) {
            throw new Error(`Trạng thái hóa đơn không hợp lệ: ${status}`);
        }
        return status as InvoiceStatus;
    }
}