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
  ApiSecurity,
} from "@nestjs/swagger";
import { plainToClass } from "class-transformer";
import { RoleRightDto } from "./dto/role-right.dto";
import { CreateRoleRightDto } from "./dto/create-role-right.dto";
import { UpdateRoleRightDto } from "./dto/update-role_right.dto";
import { RoleRightService } from "./role_right.service";
import { FindRoleRightDto } from "./dto/find-role-right.dto";
import { Public } from "../../cores/decorators/public.decorator";
import { Actions } from "../../cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";

@ApiTags("RoleRight")
@Controller("role-right")
@ApiSecurity("JWT-auth")
export class RoleRightController {
  constructor(private readonly roleRightService: RoleRightService) {}

  @Post()
  @Objectcode('RR01')
  @Actions('create')
  @ApiOperation({ summary: "Tạo mối quan hệ giữa vai trò và quyền" })
  @ApiOkResponse({ type: RoleRightDto })
  async create(@Body() createRoleRightDto: CreateRoleRightDto): Promise<any> {
    try {
      const roleRight = await this.roleRightService.create(createRoleRightDto);
      return {
        statusCode: 200,
        message: "Tạo mối quan hệ vai trò-quyền thành công.",
        data: plainToClass(RoleRightDto, roleRight),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Lỗi khi tạo mối quan hệ vai trò-quyền: ${error}`,
      };
    }
  }

  @Get()
  @Objectcode('RR01')
  @Actions('read')
  @ApiOperation({ summary: "Lọc danh sách RoleRight" })
  @ApiOkResponse({
    type: RoleRightDto,
  })
  async findAllRoleRight(@Query() query: FindRoleRightDto): Promise<any> {
    try {
      const roleRights = await this.roleRightService.findAllRoleRight(query);

      const roleRightDtos = roleRights.rows.map((roleRight) =>
        plainToClass(RoleRightDto, roleRight)
      );

      return {
        statusCode: 200,
        message: "Lấy danh sách RoleRight thành công",
        data: {
          count: roleRights.count,
          rows: roleRightDtos,
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `${error}`,
      };
    }
  }

  @Get(":id")
  @Objectcode('RR01')
  @Actions('read')
  @ApiOperation({ summary: "Lấy mối quan hệ vai trò-quyền theo ID" })
  @ApiOkResponse({ type: RoleRightDto })
  async findOne(@Param("id") id: number): Promise<any> {
    try {
      const roleRight = await this.roleRightService.findOne(id);
      return {
        statusCode: 200,
        message: "Lấy thông tin mối quan hệ vai trò-quyền thành công.",
        data: plainToClass(RoleRightDto, roleRight),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không tìm thấy mối quan hệ vai trò-quyền với ID: ${id}`,
      };
    }
  }

  @Put(":id")
  @Objectcode('RR01')
  @Actions("update")
  @HttpCode(200)
  @ApiOperation({ summary: "Cập nhật mối quan hệ vai trò-quyền theo ID" })
  @ApiOkResponse({ description: "Cập nhật thành công." })
  async update(
    @Param("id") id: number,
    @Body() updateRoleRightDto: UpdateRoleRightDto
  ): Promise<any> {
    try {
      const updatedRoleRight = await this.roleRightService.update(
        id,
        updateRoleRightDto
      );
      return {
        statusCode: 200,
        message: "Cập nhật mối quan hệ vai trò-quyền thành công.",
        data: plainToClass(RoleRightDto, updatedRoleRight),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể cập nhật mối quan hệ vai trò-quyền với ID: ${id}`,
      };
    }
  }

  @Delete(":id")
  @Objectcode('RR01')
  @Actions('delete')
  @ApiOperation({ summary: "Xóa mối quan hệ vai trò-quyền theo ID" })
  @ApiResponse({ status: 200, description: "Xóa thành công." })
  async remove(@Param("id") id: number): Promise<any> {
    try {
      const result = await this.roleRightService.remove(id);
      if (result) {
        return {
          statusCode: 200,
          message: "Xóa mối quan hệ vai trò-quyền thành công.",
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể xóa mối quan hệ vai trò-quyền với ID: ${id}`,
      };
    }
  }
}
