import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PermissionService } from 'src/modules/permission/permission.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private readonly permissionService: PermissionService,) { }

 async canActivate(
    context: ExecutionContext,
  ): Promise<boolean>{
    const isPublicRoute = this.reflector.getAllAndOverride('publicRoute', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublicRoute) {
      return true;
    }

     const action = this.reflector.getAllAndOverride<string>('action', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!action) {
      throw new ForbiddenException('Action is required!');
    }

    // Lấy user từ request
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.id) {
      throw new ForbiddenException('User information is missing!');
    }

    // Kiểm tra quyền thông qua PermissionService
    const hasPermission = await this.permissionService.hasPermission(user.id, action);

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to perform this action!');
    }

    return hasPermission;
  }
}
