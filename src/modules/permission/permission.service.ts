import { Injectable } from "@nestjs/common";
import { Role } from "src/common/enums/env.enum";
import { DataSource } from "typeorm";

@Injectable()
export class PermissionService {
  constructor(private readonly dataSource: DataSource) { }

  async getObjectCodeByUserId(userId: string): Promise<string | null> {
    try {
      const rolesQuery = `
      SELECT o.code AS object_code
      FROM "User" u
      INNER JOIN "Role" r ON u."roleId" = r.id
      INNER JOIN "RoleRight" rr ON r.id = rr."roleId"
      INNER JOIN "RightObject" ro ON rr."rightId" = ro."rightId"
      INNER JOIN "Object" o ON ro."objectId" = o.id
      WHERE u.id = $1
      `;
      const rolesResult = await this.dataSource.query(rolesQuery, [userId]); // Tham số truyền dưới dạng mảng
      console.log("rolesResult",rolesResult)
      if (rolesResult.length > 0) {
        return rolesResult[0].object_code; // Lấy giá trị trả về đầu tiên
      } else {
        return null;
      }
    } catch (error) {
      console.log('error' , error)
    }
  }

  async getUserRole(userId: string): Promise<Role | null> {
    const query = `
      SELECT r.code AS role_name
      FROM "User" u
      INNER JOIN "Role" r ON u."roleId" = r.id
      WHERE u.id = $1
    `;
    const result = await this.dataSource.query(query, [userId]);
    if (result.length > 0) {
      return result[0].role_name as Role;
    }
    return null;
  }
  async hasPermission(userId: string, action: string): Promise<boolean> {
    const objectCode = await this.getObjectCodeByUserId(userId);
    if (!objectCode) {
      return false;
    }
    
    const query = `SELECT fn_check_right($1, $2, $3) AS has_permission`;
    console.log('userId', userId)
    console.log('objectCode', objectCode)
    console.log('action', action)
    const result = await this.dataSource.query(query, [userId, objectCode, action]); // Sử dụng array cho tham số
    console.log('result' , result)
    const permissionResult = result[0] as { has_permission: boolean };
    return permissionResult.has_permission ?? false; 
  }

}
