import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PermissionService } from 'src/modules/permission/permission.service';
import { Role } from '../../../common/enums/env.enum';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride('publicRoute', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublicRoute) {
      return true;
    }

    const action = this.reflector.getAllAndOverride<string>('actions', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!action) {
      throw new ForbiddenException('Action is required!');
    }

    // Lấy user từ request
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userId) {
      throw new ForbiddenException('User information is missing!');
    }

    // Lấy danh sách role yêu cầu từ metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException('Roles are required!');
    }
    console.log(requiredRoles)
    // Lấy role của user từ database
    const userRole = await this.permissionService.getUserRole(user.userId);
    if (!userRole) {
      throw new ForbiddenException('User role is missing or invalid!');
    }
    console.log(userRole)
    // Kiểm tra role của user có nằm trong danh sách role yêu cầu không
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('you dont have permission to access the API');
    }

    // Kiểm tra quyền truy cập
    const hasPermission = await this.permissionService.hasPermission(
      user.userId,
      action,
    );
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to perform this action!');
    }

    return true;
  }
}
