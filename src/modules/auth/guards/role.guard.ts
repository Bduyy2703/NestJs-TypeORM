import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { Observable } from 'rxjs';
  import { Role } from '../../../common/enums/env.enum';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
      const isPublicRoute = this.reflector.getAllAndOverride('publicRoute', [
        context.getHandler(),
        context.getClass(),
      ]);
  
      if (isPublicRoute) {
        return true;
      }
      
      const requireRoles = this.reflector.getAllAndOverride<Role[]>('roles', [  
        context.getHandler(),
        context.getClass(),
      ]);
  
      if (!requireRoles) {
        throw new ForbiddenException('You need permission !');
      }
  
      let { user } = context.switchToHttp().getRequest();
  
      const isAllow = requireRoles.some((role) => user.roles.includes(role));
  
      if (!isAllow) {
        throw new ForbiddenException('Your permissions is not allowed !');
      }
  
      return isAllow;
    }
  }
  