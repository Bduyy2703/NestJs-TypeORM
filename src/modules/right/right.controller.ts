import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
} from "@nestjs/swagger";
import { plainToClass } from "class-transformer";
import { RightDto } from "./dto/right.dto";
import { CreateRightDto } from "./dto/create-right.dto";
import { UpdateRightDto } from "./dto/update-right.dto";
import { RightService } from "./right.service";
import { Public } from "../../cores/decorators/public.decorator";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";

@ApiTags("Right")
@Controller("right")
@ApiSecurity("JWT-auth")
export class RightController {
  constructor(private readonly rightService: RightService) {}

  @Post()
    @Objectcode('RIGHT01')
  @Actions('create')
  @ApiOperation({ summary: "Tạo Right" })
  @ApiOkResponse({ type: RightDto })
  async create(@Body() createRightDto: CreateRightDto): Promise<any> {
    try {
      const right = await this.rightService.create(createRightDto);
      return {
        statusCode: 200,
        message: "Tạo Right thành công.",
        data: plainToClass(RightDto, right),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Lỗi khi tạo Right: ${error}`,
      };
    }
  }

  @Get(":id")
  @Objectcode('RIGHT01')
  @Actions('read')
  @ApiOperation({ summary: "Lấy Right theo ID" })
  @ApiOkResponse({ type: RightDto })
  async findOne(@Param("id") id: number): Promise<any> {
    try {
      const right = await this.rightService.findOne(id);
      return {
        statusCode: 200,
        message: "Lấy thông tin Right thành công.",
        data: plainToClass(RightDto, right),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không tìm thấy Right với ID: ${id}`,
      };
    }
  }

  @Put(":id")
  @HttpCode(200)
  @Objectcode('RIGHT01')
  @Actions('update')
  @ApiOperation({ summary: "Cập nhật Right theo ID" })
  @ApiOkResponse({ description: "Cập nhật thành công." })
  async update(
    @Param("id") id: number,
    @Body() updateRightDto: UpdateRightDto
  ): Promise<any> {
    try {
      const updatedRight = await this.rightService.update(id, updateRightDto);
      return {
        statusCode: 200,
        message: "Cập nhật Right thành công.",
        data: plainToClass(RightDto, updatedRight),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể cập nhật Right với ID: ${id}`,
      };
    }
  }

  @Delete(":id")
  @Objectcode('RIGHT01')
  @Actions('delete')
  @ApiOperation({ summary: "Xóa Right theo ID" })
  @ApiResponse({ status: 200, description: "Xóa thành công." })
  async remove(@Param("id") id: number): Promise<any> {
    try {
      const result = await this.rightService.remove(id);
      if (result) {
        return {
          statusCode: 200,
          message: "Xóa Right thành công.",
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể xóa Right với ID: ${id}`,
      };
    }
  }
}
