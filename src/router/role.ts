import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import JWT from "../middlewares/JWT";
import { formatParamStructure } from "../utils";

const router = new KoaRouter();
router.prefix("/role");

// 获取角色列表
router.get("/getRole", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  if (userInfo.role_id !== 1) {
    ctx.body = formatParamStructure(403, "无权限查询！");
    return;
  }
  let roleList = (await query(`SELECT * FROM role`)) as Array<any>;
  if (roleList.length > 0) {
    ctx.body = formatParamStructure(200, "查询角色成功！", { roleList });
  } else {
    ctx.body = formatParamStructure(400, "查询角色失败！", { roleList });
  }
});

// 添加角色
router.post("/addRole", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  if (userInfo.role_id !== 1) {
    ctx.body = formatParamStructure(403, "无权限！");
    return;
  }
  let role_name = ctx.request.body.role_name;
  let result = (await query(`insert into role(role_name) values ('${role_name}')`)) as any;
  if (result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "添加角色成功！");
  } else {
    ctx.body = formatParamStructure(400, "添加角色失败！");
  }
});

// 修改角色
router.put("/updateRole", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  if (userInfo.role_id !== 1) {
    ctx.body = formatParamStructure(403, "无权限！");
    return;
  }
  let role_id = ctx.request.body.role_id;
  let role_name = ctx.request.body.role_name;
  let result = (await query(
    `update role set role_name = '${role_name}' where role_id = '${role_id}'`
  )) as any;
  if (result.changedRows === 1 && result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "更新角色成功！");
  } else {
    ctx.body = formatParamStructure(400, "更新角色失败！");
  }
});

// 删除角色
router.delete("/deleteRole", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  if (userInfo.role_id !== 1) {
    ctx.body = formatParamStructure(403, "无权限！");
    return;
  }
  let role_id = ctx.request.body.role_id;
  let result = (await query(`DELETE from role where role_id = '${role_id}'`)) as any;
  if ((result.changedRows = 1)) {
    ctx.body = formatParamStructure(200, "删除角色成功！");
  } else {
    ctx.body = formatParamStructure(400, "删除角色失败！");
  }
});

export default router;
