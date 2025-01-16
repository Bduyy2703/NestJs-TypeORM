import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { plainToClass } from "class-transformer";
import { RightObjectDto } from "./dto/right-object.dto";
import { CreateRightObjectDto } from "./dto/create-right-object.dto";
import { UpdateRightObjectDto } from "./dto/update-right-object.dto";
import { RightObjectService } from "./right_object.service";
import { FindRightObjectDto } from "./dto/find-right-object.dto";
import { Public } from "../../cores/decorators/public.decorator";
import { Roles } from "../../cores/decorators/roles.decorator";
import { Actions } from "../../cores/decorators/action.decorator";
import { Role } from "src/common/enums/env.enum";

@ApiTags("RightObject")
@Controller("right-object")
export class RightObjectController {
  constructor(private readonly rightObjectService: RightObjectService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Actions('create')
  @ApiOperation({ summary: "Tạo mối quan hệ giữa quyền và đối tượng" })
  @ApiOkResponse({ type: RightObjectDto })
  async create(
    @Body() createRightObjectDto: CreateRightObjectDto
  ): Promise<any> {
    try {
      const rightObject = await this.rightObjectService.create(
        createRightObjectDto
      );
      return {
        statusCode: 200,
        message: "Tạo mối quan hệ quyền-đối tượng thành công.",
        data: plainToClass(RightObjectDto, rightObject),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Lỗi khi tạo mối quan hệ quyền-đối tượng: ${error.message}`,
      };
    }
  }

  @Get()
  @Roles(Role.ADMIN)
  @Actions('read')
  @ApiOperation({ summary: "Lọc danh sách RightObject" })
  @ApiOkResponse({
    type: RightObjectDto,
  })
  async findAll(@Query() query: FindRightObjectDto): Promise<any> {
    try {
      const rightObjects = await this.rightObjectService.findAll(query);

      const rightObjectDtos = rightObjects.rows.map((rightObject) =>
        plainToClass(RightObjectDto, rightObject)
      );

      return {
        statusCode: 200,
        message: "Lấy danh sách RightObject thành công",
        data: {
          count: rightObjects.count,
          rows: rightObjectDtos,
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `${error.message}`,
      };
    }
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  @Actions('read')
  @ApiOperation({ summary: "Lấy mối quan hệ quyền-đối tượng theo ID" })
  @ApiOkResponse({ type: RightObjectDto })
  async findOne(@Param("id") id: number): Promise<any> {
    try {
      const rightObject = await this.rightObjectService.findOne(id);
      return {
        statusCode: 200,
        message: "Lấy thông tin mối quan hệ quyền-đối tượng thành công.",
        data: plainToClass(RightObjectDto, rightObject),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không tìm thấy mối quan hệ quyền-đối tượng với ID: ${id}`,
      };
    }
  }

  @Put(":id")
  @Roles(Role.ADMIN )
  @HttpCode(200)
  @Actions("update")
  @ApiOperation({ summary: "Cập nhật mối quan hệ quyền-đối tượng theo ID" })
  @ApiOkResponse({ description: "Cập nhật thành công." })
  async update(
    @Param("id") id: number,
    @Body() updateRightObjectDto: UpdateRightObjectDto
  ): Promise<any> {
    try {
      const updatedRightObject = await this.rightObjectService.update(
        id,
        updateRightObjectDto
      );
      return {
        statusCode: 200,
        message: "Cập nhật mối quan hệ quyền-đối tượng thành công.",
        data: plainToClass(
          RightObjectDto,
          updatedRightObject
        ),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể cập nhật mối quan hệ quyền-đối tượng với ID: ${id}`,
      };
    }
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @Actions('delete')
  @ApiOperation({ summary: "Xóa mối quan hệ quyền-đối tượng theo ID" })
  @ApiResponse({ status: 200, description: "Xóa thành công." })
  async remove(@Param("id") id: number): Promise<any> {
    try {
      const result = await this.rightObjectService.remove(id);
      if (result) {
        return {
          statusCode: 200,
          message: "Xóa mối quan hệ quyền-đối tượng thành công.",
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể xóa mối quan hệ quyền-đối tượng với ID: ${id}`,
      };
    }
  }
}
