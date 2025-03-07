import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from 'src/modules/permission/permission.service';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride("publicRoute", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublicRoute) {
      return true;
    }
    const objectcodes = this.reflector.getAllAndOverride<string>(
      "objectcode",
      [context.getHandler(), context.getClass()]
    );

    if (!objectcodes) {
      throw new ForbiddenException("Bạn cần quyền để truy cập!");
    }

    const { user } = context.switchToHttp().getRequest();
    const actions = this.reflector.getAllAndOverride<string>("actions", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!actions || actions.length === 0) {
      throw new ForbiddenException("Không tìm thấy action phù hợp!");
    }
    const hasPermission = await this.permissionService.hasPermission(
      user.userId,
      objectcodes,
      actions
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        "Bạn không có quyền thực hiện hành động này!"
      );
    }

    return true;
  }
}
