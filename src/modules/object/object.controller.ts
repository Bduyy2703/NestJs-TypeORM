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
} from "@nestjs/swagger";
import { plainToClass } from "class-transformer";
import { ObjectDto } from "./dto/object.dto";
import { CreateObjectDto } from "./dto/create-object.dto";
import { UpdateObjectDto } from "./dto/update-object.dto";
import { ObjectService } from "./object.service";
import { Actions } from "../../cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";

@ApiTags("Object")
@Controller("object")
export class ObjectController {
  constructor(private readonly objectService: ObjectService) {}

  @Post()
  @Objectcode('OBJECT01')
  @Actions("create")
  @ApiOperation({ summary: "Tạo Object" })
  @ApiOkResponse({ type: ObjectDto })
  async create(@Body() createObjectDto: CreateObjectDto): Promise<any> {
    try {
      const object = await this.objectService.create(createObjectDto);
      return {
        statusCode: 200,
        message: "Tạo Object thành công.",
        data: plainToClass(ObjectDto, object),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Lỗi khi tạo Object: ${error}`,
      };
    }
  }

  @Get(":id")
  @HttpCode(200)
  @Objectcode('OBJECT01')
  @Actions("read")
  @ApiOperation({ summary: "Lấy Object theo ID" })
  @ApiOkResponse({ type: ObjectDto })
  async findOne(@Param("id") id: number): Promise<any> {
    try {
      const object = await this.objectService.findOne(id);
      return {
        statusCode: 200,
        message: "Lấy thông tin Object thành công.",
        data: plainToClass(ObjectDto, object),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không tìm thấy Object với ID: ${id}`,
      };
    }
  }

  @Put(":id")
  @Objectcode('OBJECT01')
  @Actions('update')
  @ApiOperation({ summary: "Cập nhật Object theo ID" })
  @ApiOkResponse({ description: "Cập nhật thành công." })
  async update(
    @Param("id") id: number,
    @Body() updateObjectDto: UpdateObjectDto
  ): Promise<any> {
    try {
      const updatedObject = await this.objectService.update(
        id,
        updateObjectDto
      );
      return {
        statusCode: 200,
        message: "Cập nhật Object thành công.",
        data: plainToClass(ObjectDto, updatedObject),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể cập nhật Object với ID: ${id}`,
      };
    }
  }

  @Delete(":id")
  @Objectcode('OBJECT01')
  @Actions('delete')
  @ApiOperation({ summary: "Xóa Object theo ID" })
  @ApiResponse({ status: 200, description: "Xóa thành công." })
  async remove(@Param("id") id: number): Promise<any> {
    try {
      const result = await this.objectService.remove(id);
      if (result) {
        return {
          statusCode: 200,
          message: "Xóa Object thành công.",
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể xóa Object với ID: ${id}`,
      };
    }
  }
}
