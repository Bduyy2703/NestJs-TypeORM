import { Injectable } from "@nestjs/common";
import { stringify } from "querystring";
import { DataSource } from "typeorm";

@Injectable()
export class PermissionService {
  constructor(private dataSource: DataSource) { }

  async hasPermission(
    userId: string,
    objectCode: string,
    action: string
  ): Promise<boolean> {
    const objectCodeStr = String(objectCode);
    const actionStr = String(action);
    const query = `
      SELECT fn_check_right($1, $2, $3) AS has_permission
    `;
    const result = await this.dataSource.query(query, [userId, objectCodeStr, actionStr]);

    return result[0].has_permission ?? false;
  }
}


// function to check the permisstion . while droping database if the func be deleted can copy .
/**
 * select case when count(*) > 0 then true else false end
from "user" u
INNER JOIN role_right rr ON rr."roleId" = u."roleId"
INNER JOIN right_object ro ON ro."rightId" = rr."rightId"
inner join object_entity o on ro."objectId" = o.id
where u.id = p_userid
  and o.code = p_object
  and (
  (p_action = 'read' and ro."readYn" = true)
  OR
  (p_action = 'update' and ro."updateYn" = true)
  OR 
  (p_action = 'delete' and ro."deleteYn" = true)
  OR 
  (p_action = 'create' and ro."createYn" = true)
  OR 
  (p_action = 'execute' and ro."executeYn" = true)
  );
 */