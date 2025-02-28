import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class PermissionService {
  constructor(private dataSource: DataSource) {}

  async hasPermission(
    userId: number,
    objectCode: string[],
    action: string[]
  ): Promise<boolean> {
    const query = `
      SELECT fn_check_right($1, $2, $3) AS has_permission
    `;

    const result = await this.dataSource.query(query, [userId, objectCode, action]);

    return result[0]?.has_permission ?? false;
  }
}
