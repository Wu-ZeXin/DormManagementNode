import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import JWT from "../middlewares/JWT";
import { formatParamStructure } from "../utils";

const router = new KoaRouter();
router.prefix("/authority");

const integrationAuthority = (authority_set: Array<any>, authority: any) => {
  authority_set.forEach((item: any) => {
    if (item.authority_id === authority.authority_id) return;
    if (item.authority_id === authority.authority_pid) {
      if (item.hasOwnProperty("children")) {
        item["children"].push(authority);
      } else {
        item["children"] = [];
        item["children"].push(authority);
      }
    }
  });
};

const integrationRouteAndOperation = (authority_set: Array<any>, authority: any) => {
  authority_set.forEach((item: any) => {
    if (item.authority_id === authority.authority_id) return;
    if (item.authority_id === authority.authority_pid) {
      if (item.hasOwnProperty("children")) {
        if (item.authority_type === 0) {
          item["children"]["route_authority"].push(authority);
        } else {
          item["children"]["operation_authority"].push(authority);
        }
      } else {
        item["children"] = {};
        item["children"]["route_authority"] = [];
        item["children"]["operation_authority"] = [];
        if (authority.authority_type === 0) {
          item["children"]["route_authority"].push(authority);
        } else {
          item["children"]["operation_authority"].push(authority);
        }
      }
    }
  });
};
// 查找权限
router.get("/getAuthority", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  if (userInfo.role_id !== 1) {
    ctx.body = formatParamStructure(400, "无权限查询！")
    return;
  }
  let result = (await query(`SELECT * from authority`)) as Array<any>;
  let authority: Array<any> = [];
  result.forEach((item: any) => {
    if (item.authority_pid === 0) {
      authority.push(item);
    } else {
      integrationRouteAndOperation(result, item);
    }
  });
  ctx.body = formatParamStructure(200, "查询权限成功!", { authority });
});

// 增加权限
router.post("/addAuthority", async (ctx, next) => {});

// 修改权限
router.put("/updateAuthority", async (ctx, next) => {});

// 删除权限
router.delete("/deleteAuthority", async (ctx, next) => {});

// 查找角色权限
router.get("/getRoleAuthority", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  if (userInfo.role_id !== 1) {
    ctx.body = formatParamStructure(400, "无权限查询！")
    return;
  }
  const role = ctx.request.query.role;
  let result = (await query(`
  SELECT b.authority_id, b.authority_pid, b.authority_title, b.authority_name, b.authority_path, b.authority_type
  from (role_authority a)
  INNER JOIN (authority b)
  on a.role_id = '${role}' and a.authority_id = b.authority_id
  `)) as Array<any>;
  console.log(role);
  console.log(result);
  let authority: Array<any> = [];
  result.forEach((item: any) => {
    if (item.authority_pid === 0) {
      authority.push(item);
    } else {
      integrationRouteAndOperation(result, item);
    }
  });
  ctx.body = formatParamStructure(200, "查询角色权限成功!", { authority });
});

// 增加角色权限
router.post("/addRoleAuthority", async (ctx, next) => {});

// 删除角色权限
router.delete("/deleteRoleAuthority", async (ctx, next) => {});

// 查询用户权限
router.get("/getUserAuthority", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let route_authority: Array<any> = [];
  let operation_authority: Array<any> = [];
  let role_authority_id = [];
  let add_user_authority = [];
  let delete_user_authority = [];
  let role_authority = (await query(`
    SELECT c.authority_id, c.authority_pid, c.authority_title, c.authority_name, c.authority_path, c.authority_type
    from (${userInfo.role} a) on a.usermark = '${userInfo.usermark}'
    left join (role_authority b) on a.role = b.role_id
    left join (authority c) on b.authority_id = c.authority_id
  `)) as Array<any>;
  let user_authority = (await query(`
    SELECT b.authority_id, b.authority_pid, b.authority_title, b.authority_name, b.authority_path, b.authority_type, a.status
    from (user_authority a)
    INNER JOIN (authority b)
    on a.usermark = '${userInfo.usermark}' and a.authority_id = b.authority_id
  `)) as Array<any>;
  role_authority.forEach((item: any) => {
    role_authority_id.push(item.authority_id);
  });
  user_authority.forEach(async (item: any) => {
    if (role_authority_id.includes(item.authority_id)) {
      if (item.status === 0) {
        delete_user_authority.push(item.authority_id);
      } else {
        await query(`
          DELETE from user_authority where usermark = '${userInfo.usermark}' and authority_id = '${item.authority_id}'
        `);
      }
    } else {
      if (item.status === 0) {
        await query(`
          DELETE from user_authority where usermark = '${userInfo.usermark}' and authority_id = '${item.authority_id}'
        `);
      } else {
        add_user_authority.push(item);
      }
    }
  });
  let authority = role_authority
    .filter((item: any) => {
      return !delete_user_authority.includes(item.authority_id);
    })
    .concat(add_user_authority);
  authority.forEach((item: any) => {
    if (item.authority_type === 1) {
      operation_authority.push(item.authority_name);
    } else {
      if (item.authority_pid === 0) {
        route_authority.push(item);
      } else {
        integrationAuthority(authority, item);
      }
    }
  });
  if (role_authority.length > 0 && user_authority.length >= 0) {
    ctx.body = formatParamStructure(200, "获取用户权限成功!", {
      route_authority,
      operation_authority
    });
  } else {
    ctx.body = formatParamStructure(400, "获取用户权限失败!");
  }
});

// 增加用户权限
router.post("/addUserAuthority", async (ctx, next) => {});

// 删除用户权限
router.delete("/deleteUserAuthority", async (ctx, next) => {});

export default router;
