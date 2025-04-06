import { Controller, Post, Body, Get, Param, Query } from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
import { CreateInvoiceDto, InvoiceResponseDto, RevenueStatisticsDto, StatusStatisticsDto, TopProductStatisticsDto, TopCustomerStatisticsDto, PaymentMethodStatisticsDto, InvoiceCountStatisticsDto } from "./dto/invoice.dto";
import { ApiSecurity, ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";

@ApiTags("Invoices")
@Controller("invoices")
@ApiSecurity("JWT-auth")
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    // 1. Tạo invoice
    @Post()
    @Actions('create')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Tạo một hóa đơn mới" })
    @ApiResponse({ status: 201, description: "Hóa đơn được tạo thành công", type: InvoiceResponseDto })
    async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
        return this.invoiceService.createInvoice(createInvoiceDto);
    }

    // 2. Lấy chi tiết 1 invoice theo ID
    @Get(":id")
    @Actions('execute')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Lấy chi tiết một hóa đơn theo ID" })
    @ApiResponse({ status: 200, description: "Chi tiết hóa đơn", type: InvoiceResponseDto })
    async getInvoiceById(@Param("id") id: number): Promise<InvoiceResponseDto> {
        return this.invoiceService.getInvoiceById(id);
    }

    // 3. Lấy danh sách invoices theo userId
    @Get("user/:userId")
    @Actions('execute')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Lấy danh sách hóa đơn của một user" })
    @ApiResponse({ status: 200, description: "Danh sách hóa đơn của user", type: [InvoiceResponseDto] })
    async getInvoicesByUserId(@Param("userId") userId: string): Promise<InvoiceResponseDto[]> {
        return this.invoiceService.getInvoicesByUserId(userId);
    }

    // 4. Lấy danh sách tất cả invoices (dành cho admin)
    @Get()
    @Actions('read')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Lấy danh sách tất cả hóa đơn (admin)" })
    @ApiResponse({ status: 200, description: "Danh sách tất cả hóa đơn", type: [InvoiceResponseDto] })
    async getAllInvoices(): Promise<InvoiceResponseDto[]> {
        return this.invoiceService.getAllInvoices();
    }

    // 5. Thống kê doanh thu theo khoảng thời gian
    @Get("statistics/revenue")
    @Actions('read')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Thống kê doanh thu theo khoảng thời gian (admin)" })
    @ApiQuery({ name: "startDate", type: String, required: true, description: "Ngày bắt đầu (YYYY-MM-DD)" })
    @ApiQuery({ name: "endDate", type: String, required: true, description: "Ngày kết thúc (YYYY-MM-DD)" })
    @ApiResponse({ status: 200, description: "Thống kê doanh thu", type: RevenueStatisticsDto })
    async getRevenueStatistics(
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
    ): Promise<RevenueStatisticsDto> {
        return this.invoiceService.getRevenueStatistics(startDate, endDate);
    }

    // 6. Thống kê số lượng hóa đơn theo trạng thái
    @Get("statistics/status")
    @Actions('read')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Thống kê số lượng hóa đơn theo trạng thái (admin)" })
    @ApiQuery({ name: "startDate", type: String, required: true, description: "Ngày bắt đầu (YYYY-MM-DD)" })
    @ApiQuery({ name: "endDate", type: String, required: true, description: "Ngày kết thúc (YYYY-MM-DD)" })
    @ApiResponse({ status: 200, description: "Thống kê số lượng hóa đơn theo trạng thái", type: StatusStatisticsDto })
    async getStatusStatistics(
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
    ): Promise<StatusStatisticsDto> {
        return this.invoiceService.getStatusStatistics(startDate, endDate);
    }

    // 7. Thống kê sản phẩm bán chạy
    @Get("statistics/top-products")
    @Actions('read')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Thống kê sản phẩm bán chạy (admin)" })
    @ApiQuery({ name: "startDate", type: String, required: true, description: "Ngày bắt đầu (YYYY-MM-DD)" })
    @ApiQuery({ name: "endDate", type: String, required: true, description: "Ngày kết thúc (YYYY-MM-DD)" })
    @ApiQuery({ name: "limit", type: Number, required: false, description: "Số lượng sản phẩm tối đa (mặc định 10)" })
    @ApiResponse({ status: 200, description: "Danh sách sản phẩm bán chạy", type: [TopProductStatisticsDto] })
    async getTopProducts(
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
        @Query("limit") limit: string = "10",
    ): Promise<TopProductStatisticsDto[]> {
        return this.invoiceService.getTopProducts(startDate, endDate, parseInt(limit));
    }

    // 8. Thống kê khách hàng chi tiêu nhiều nhất
    @Get("statistics/top-customers")
    @Actions('read')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Thống kê khách hàng chi tiêu nhiều nhất (admin)" })
    @ApiQuery({ name: "startDate", type: String, required: true, description: "Ngày bắt đầu (YYYY-MM-DD)" })
    @ApiQuery({ name: "endDate", type: String, required: true, description: "Ngày kết thúc (YYYY-MM-DD)" })
    @ApiQuery({ name: "limit", type: Number, required: false, description: "Số lượng khách hàng tối đa (mặc định 10)" })
    @ApiResponse({ status: 200, description: "Danh sách khách hàng chi tiêu nhiều nhất", type: [TopCustomerStatisticsDto] })
    async getTopCustomers(
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
        @Query("limit") limit: string = "10",
    ): Promise<TopCustomerStatisticsDto[]> {
        return this.invoiceService.getTopCustomers(startDate, endDate, parseInt(limit));
    }

    // 9. Thống kê doanh thu theo phương thức thanh toán
    @Get("statistics/payment-methods")
    @Actions('read')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Thống kê doanh thu theo phương thức thanh toán (admin)" })
    @ApiQuery({ name: "startDate", type: String, required: true, description: "Ngày bắt đầu (YYYY-MM-DD)" })
    @ApiQuery({ name: "endDate", type: String, required: true, description: "Ngày kết thúc (YYYY-MM-DD)" })
    @ApiResponse({ status: 200, description: "Thống kê doanh thu theo phương thức thanh toán", type: [PaymentMethodStatisticsDto] })
    async getPaymentMethodStatistics(
        @Query("startDate") startDate: string,
        @Query("endDate") endDate: string,
    ): Promise<PaymentMethodStatisticsDto[]> {
        return this.invoiceService.getPaymentMethodStatistics(startDate, endDate);
    }

    // 10. Thống kê số lượng hóa đơn theo ngày/tháng
    @Get("statistics/invoice-count")
    @Actions('read')
    @Objectcode('INVOICE01')
    @ApiOperation({ summary: "Thống kê số lượng hóa đơn theo ngày/tháng (admin)" })
    @ApiQuery({ name: "type", type: String, required: true, description: "Loại thống kê (daily/monthly)" })
    @ApiQuery({ name: "year", type: Number, required: true, description: "Năm thống kê" })
    @ApiQuery({ name: "month", type: Number, required: false, description: "Tháng thống kê (chỉ cần khi type=daily)" })
    @ApiResponse({ status: 200, description: "Thống kê số lượng hóa đơn", type: [InvoiceCountStatisticsDto] })
    async getInvoiceCountStatistics(
        @Query("type") type: 'daily' | 'monthly',
        @Query("year") year: string,
        @Query("month") month?: string,
    ): Promise<InvoiceCountStatisticsDto[]> {
        return this.invoiceService.getInvoiceCountStatistics(type, parseInt(year), month ? parseInt(month) : undefined);
    }
}