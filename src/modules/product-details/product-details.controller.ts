import {
    Controller,
    Post,
    Body,
    Put,
    Delete,
    Param,
    Get,
    Query,
    NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiSecurity, ApiOperation } from "@nestjs/swagger";
import { ProductDetailsService } from "./product.service";
import { CreateProductDetailsDto, UpdateProductDetailsDto } from "./dto/create-update.dto";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";
import { Public } from "src/cores/decorators/public.decorator";

@Controller("product-details")
@ApiTags("Product Details")
@ApiSecurity("JWT-auth")
export class ProductDetailsController {
    constructor(private readonly productDetailsService: ProductDetailsService) {}

    @Post("create/:productId")
    @Actions("create")
    @Objectcode("PRODUCT_DETAILS01")
    @ApiOperation({ summary: "Tạo biến thể sản phẩm dựa trên productId" })
    async create(
        @Param("productId") productId: number,
        @Body() createDto: CreateProductDetailsDto
    ) {
        return this.productDetailsService.create(productId, createDto);
    }

    @Get(":productId")
    @Public()
    @ApiOperation({ summary: "Lấy tất cả biến thể của một sản phẩm" })
    async findAll(@Param("productId") productId: number) {
        return this.productDetailsService.findAll(productId);
    }

    @Get("detail/:id")
    @Public()
    @ApiOperation({ summary: "Lấy chi tiết một ProductDetails cụ thể" })
    async findOne(@Param("id") id: number) {
        const detail = await this.productDetailsService.findOne(id);
        if (!detail) throw new NotFoundException("ProductDetails not found");
        return detail;
    }

    @Put(":id")
    @Actions("update")
    @Objectcode("PRODUCT_DETAILS01")
    @ApiOperation({ summary: "Cập nhật một ProductDetails" })
    async update(
        @Param("id") id: number,
        @Body() updateDto: UpdateProductDetailsDto
    ) {
        return this.productDetailsService.update(id, updateDto);
    }

    @Delete(":id")
    @Actions("delete")
    @Objectcode("PRODUCT_DETAILS01")
    @ApiOperation({ summary: "Xóa một ProductDetails" })
    async remove(@Param("id") id: number) {
        return this.productDetailsService.remove(id);
    }
}
