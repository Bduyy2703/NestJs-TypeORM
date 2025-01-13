import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class PermissionService {
  constructor(private readonly dataSource: DataSource) { }

  async getObjectCodeByUserId(userId: number): Promise<string | null> {
    const rolesQuery = `
      SELECT o.code AS object_code
      FROM t_user u
      INNER JOIN t_role r ON u.roleid = r.id
      INNER JOIN t_role_right rr ON r.id = rr.roleid
      INNER JOIN t_right_object ro ON rr.rightid = ro.rightid
      INNER JOIN t_object o ON ro.objectid = o.id
      WHERE u.id = ?
    `;

    const rolesResult = await this.dataSource.query(rolesQuery, [userId]); // Tham số truyền dưới dạng mảng

    if (rolesResult.length > 0) {
      return rolesResult[0].object_code; // Lấy giá trị trả về đầu tiên
    } else {
      return null;
    }
  }
  async hasPermission(userId: number, action: string): Promise<boolean> {
    const objectCode = await this.getObjectCodeByUserId(userId);
    if (!objectCode) {
      return false;
    }


    const query = `SELECT fn_check_right(:userId, :objectCode, :action) AS has_permission`;

    const result = await this.dataSource.query(query, [userId, objectCode, action]); // Sử dụng array cho tham số

    const permissionResult = result[0] as { has_permission: boolean };
    return permissionResult.has_permission ?? false;
  }

}
