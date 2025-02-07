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
import { RoleDto } from "./dto/role.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RoleService } from "./role.service";
import { Roles } from "../../cores/decorators/roles.decorator";
import { Role } from "src/common/enums/env.enum";
import { Actions } from "src/cores/decorators/action.decorator";
import { Public } from "src/cores/decorators/public.decorator";

@ApiTags("Role")
@Controller("role")
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Public()
  // @Roles(Role.ADMIN)
  @Actions('create')
  @ApiOperation({ summary: "Tạo Role" })
  @ApiOkResponse({ type: RoleDto })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<any> {
    try {
      const role = await this.roleService.create(createRoleDto);
      return {
        statusCode: 200,
        message: "Tạo Role thành công.",
        data: plainToClass(RoleDto, role),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Lỗi khi tạo Role: ${error}`,
      };
    }
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  @Actions('read')
  @ApiOperation({ summary: "Lấy Role theo ID" })
  @ApiOkResponse({ type: RoleDto })
  async findOne(@Param("id") id: number): Promise<any> {
    try {
      const role = await this.roleService.findOne(id);
      return {
        statusCode: 200,
        message: "Lấy thông tin Role thành công.",
        data: plainToClass(RoleDto, role),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không tìm thấy Role với ID: ${id}`,
      };
    }
  }

  @Put(":id")
  @Roles(Role.ADMIN)
  @Actions('update')
  @ApiOperation({ summary: "Cập nhật Role theo ID" })
  @HttpCode(200)
  @ApiOkResponse({  description: "Cập nhật thành công." })
  async update(
    @Param("id") id: number,
    @Body() updateRoleDto: UpdateRoleDto
  ): Promise<any> {
    try {
      const updatedRole = await this.roleService.update(id, updateRoleDto);
      return {
        statusCode: 200,
        message: "Cập nhật Role thành công.",
        data: plainToClass(RoleDto, updatedRole),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể cập nhật Role với ID: ${id}`,
      };
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa Role theo ID" })
  @Roles(Role.ADMIN)
  @Actions('delete')
  @ApiResponse({ status: 200, description: "Xóa thành công." })
  async remove(@Param("id") id: number): Promise<any> {
    try {
      const result = await this.roleService.remove(id);
      if (result) {
        return {
          statusCode: 200,
          message: "Xóa Role thành công.",
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: `Không thể xóa Role với ID: ${id}`,
      };
    }
  }
}
