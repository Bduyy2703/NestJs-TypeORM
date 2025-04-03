import { Controller, Get, Post, Body, Param, Put, Delete, HttpStatus } from "@nestjs/common";
import { DiscountService } from "./discount.service";
import { CreateDiscountDto, UpdateDiscountDto } from "./dto/discount.dto";
import { ApiTags, ApiOperation, ApiParam, ApiSecurity, ApiResponse } from "@nestjs/swagger";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";

@ApiTags("Discount")
@Controller("discounts")
@ApiSecurity('JWT-auth')
export class DiscountController {
    constructor(private readonly discountService: DiscountService) { }

    @Post()
    @Actions('create')
    @Objectcode('DISCOUNT01')
    @ApiOperation({ summary: "Tạo mã giảm giá mới" })
    @ApiResponse({ status: HttpStatus.OK, description: "Thành công" })
    create(@Body() dto: CreateDiscountDto) {
        return this.discountService.create(dto);
    }

    @Get()
    @Actions('read')
    @Objectcode('DISCOUNT01')
    @ApiOperation({ summary: "Lấy danh sách tất cả mã giảm giá" })
    @ApiResponse({ status: HttpStatus.OK, description: "Thành công" })
    findAll() {
        return this.discountService.findAll();
    }

    @Get(":id")
    @Actions('read')
    @Objectcode('DISCOUNT01')
    @ApiOperation({ summary: "Lấy thông tin mã giảm giá theo ID" })
    @ApiParam({ name: "id", type: "number", example: 1 })
    @ApiResponse({ status: HttpStatus.OK, description: "Thành công" })
    findOne(@Param("id") id: number) {
        return this.discountService.findOne(id);
    }

    @Put(":id")
    @Actions('update')
    @Objectcode('DISCOUNT01')
    @ApiOperation({ summary: "Cập nhật mã giảm giá theo ID" })
    @ApiParam({ name: "id", type: "number", example: 1 })
    @ApiResponse({ status: HttpStatus.OK, description: "Thành công" })
    update(@Param("id") id: number, @Body() dto: UpdateDiscountDto) {
        return this.discountService.update(id, dto);
    }

    @Delete(":id")
    @Actions('delete')
    @Objectcode('DISCOUNT01')
    @ApiOperation({ summary: "Xóa mã giảm giá theo ID" })
    @ApiParam({ name: "id", type: "number", example: 1 })
    @ApiResponse({ status: HttpStatus.OK, description: "Thành công" })
    remove(@Param("id") id: number) {
        return this.discountService.remove(id);
    }
}
