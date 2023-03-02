import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import { formatParamStructure } from "../utils";

const router = new KoaRouter();
router.prefix("/dorm_build");

// 获取宿舍楼信息列表
router.get("/getDormBuild", async (ctx, next) => {
  let dorm_build_name = ctx.request.query.dorm_build_name as string;
  let dorm_build_manager = ctx.request.query.dorm_build_manager as string;
  let pageSize: any = ctx.request.query.pageSize;
  let page: any = ctx.request.query.page;
  let topPageIndex: number = (page - 1) * pageSize;
  let total: number = 0;
  let result: Array<any>;
  if (dorm_build_name === "" && dorm_build_manager === "") {
    result = (await query("SELECT COUNT(*) FROM dorm_build")) as Array<any>;
    total = result[0]["COUNT(*)"];
    result = (await query(`
      SELECT a.dorm_build_id, a.dorm_build_name, b.usermark, b.name, b.sex, b.telephone
      from (dorm_build a)
      INNER JOIN (employee b)
      on a.dorm_build_manager = b.usermark
      limit ${topPageIndex},${pageSize}
    `)) as Array<any>;
  } else {
    if (dorm_build_name !== "" && dorm_build_manager === "") {
      result = (await query(`
        SELECT a.dorm_build_id, a.dorm_build_name, b.usermark, b.name, b.sex, b.telephone
        from (dorm_build a)
        INNER JOIN (employee b)
        on a.dorm_build_name = '${dorm_build_name}' and a.dorm_build_manager = b.usermark
      `)) as Array<any>;
      total = result.length;
      result = (await query(`
        SELECT a.dorm_build_id, a.dorm_build_name, b.usermark, b.name, b.sex, b.telephone
        from (dorm_build a)
        INNER JOIN (employee b)
        on a.dorm_build_name = '${dorm_build_name}' and a.dorm_build_manager = b.usermark
        limit ${topPageIndex},${pageSize}
      `)) as Array<any>;
    } else if (dorm_build_name === "" && dorm_build_manager !== "") {
      result = (await query(`
        SELECT a.dorm_build_id, a.dorm_build_name, b.usermark, b.name, b.sex, b.telephone
        from (dorm_build a)
        INNER JOIN (employee b)
        on a.dorm_build_manager = '${dorm_build_manager}' and a.dorm_build_manager = b.usermark
      `)) as Array<any>;
      total = result.length;
    } else {
      result = (await query(`
        SELECT a.dorm_build_id, a.dorm_build_name, b.usermark, b.name, b.sex, b.telephone
        from (dorm_build a)
        INNER JOIN (employee b)
        on a.dorm_build_name = '${dorm_build_name}' and a.dorm_build_manager = '${dorm_build_manager}' and a.dorm_build_manager = b.usermark
      `)) as Array<any>;
      total = result.length;
    }
  }
  ctx.body =
    result.length > 0
      ? formatParamStructure(200, "查询宿舍楼负责人成功！", { dormBuildInfo: result, total })
      : formatParamStructure(400, "查询宿舍楼负责人失败！", { dormBuildInfo: result, total });
});

// 添加宿舍楼信息
router.post("/addDormBuild", async (ctx, next) => {
  let dorm_build_name = ctx.request.body.dorm_build_name;
  let dorm_build_manager = ctx.request.body.dorm_build_manager;
  let result = (await query(
    `insert into dorm_build(dorm_build_name, dorm_build_manager) values ('${dorm_build_name}', '${dorm_build_manager}')`
  )) as any;
  ctx.body =
    result.affectedRows === 1
      ? formatParamStructure(200, "添加宿舍楼信息成功！")
      : formatParamStructure(400, "添加宿舍楼信息失败！");
});

// 修改宿舍楼信息
router.put("/updateDormBuild", async (ctx, next) => {
  let dorm_build_id = ctx.request.body.dorm_build_id;
  let dorm_build_manager = ctx.request.body.usermark;
  let result = (await query(
    `update dorm_build set dorm_build_manager = '${dorm_build_manager}' where dorm_build_id = '${dorm_build_id}'`
  )) as any;
  ctx.body =
    result.changedRows === 1 && result.affectedRows === 1
      ? formatParamStructure(200, "更新宿舍楼信息成功！")
      : formatParamStructure(400, "更新宿舍楼信息失败！");
});

// 删除宿舍楼信息
router.delete("/deleteDormBuild", async (ctx, next) => {
  let dorm_build_id = ctx.request.body.dorm_build_id;
  let result = (await query(
    `DELETE from dorm_build where dorm_build_id = '${dorm_build_id}'`
  )) as any;
  console.log(result)
  ctx.body =
    result.affectedRows === 1
      ? formatParamStructure(200, "删除宿舍楼信息成功！")
      : formatParamStructure(400, "删除宿舍楼信息失败！");
});

export default router;
