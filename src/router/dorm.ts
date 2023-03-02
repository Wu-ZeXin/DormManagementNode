import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import JWT from "../middlewares/JWT";
import { formatParamStructure } from "../utils";

const router = new KoaRouter();
router.prefix("/dorm");

// 获取宿舍列表
router.get("/getDorm", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let dorm = ctx.request.query.dorm;
  let pageSize: any = ctx.request.query.pageSize;
  let page: any = ctx.request.query.page;
  let dorm_build = await query(
    `SELECT dorm_build_id FROM dorm_build where dorm_build_manager = '${userInfo.usermark}'`
  );
  let topPageIndex: number = (page - 1) * pageSize;
  let total: number = 0;
  let dorm_build_id = dorm_build[0].dorm_build_id;
  let result: Array<any>;
  if (dorm === "") {
    result = (await query(
      `SELECT COUNT(*) FROM dorm where dorm_build_id = '${dorm_build_id}'`
    )) as Array<any>;
    total = result[0]["COUNT(*)"];
    result = (await query(`
      SELECT dorm_build_id, dorm_number, dorm_population
      from dorm where dorm_build_id = '${dorm_build_id}'
      order by dorm_number
      limit ${topPageIndex},${pageSize}
    `)) as Array<any>;
  } else {
    result = (await query(`
      SELECT dorm_build_id, dorm_number, dorm_population
      from dorm where dorm_build_id = '${dorm_build_id}' and dorm_number = '${dorm}'
      limit ${topPageIndex},${pageSize}
    `)) as Array<any>;
    total = result.length;
  }
  ctx.body =
    result.length > 0
      ? formatParamStructure(200, "查询宿舍成功！", { dormInfo: result, total })
      : formatParamStructure(400, "查询宿舍失败！", { dormInfo: result, total });
});

// 添加宿舍
router.post("/addDorm", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let dorm = ctx.request.body.dorm;
  let result: any = {
    affectedRows: 0
  };
  let dorm_build = await query(
    `SELECT dorm_build_id FROM dorm_build where dorm_build_manager = '${userInfo.usermark}'`
  );
  let dorm_build_id = dorm_build[0].dorm_build_id;
  let dorms = (await query(
    `SELECT dorm_number FROM dorm where dorm_build_id = '${dorm_build_id}'`
  )) as Array<any>;
  let isHave = dorms.some(item => {
    return item.dorm_number == dorm;
  });
  console.log(isHave);
  if (!isHave) {
    result = (await query(
      `insert into dorm(dorm_build_id, dorm_number, dorm_population) values('${dorm_build_id}', '${dorm}', 0)`
    )) as any;
  }
  ctx.body =
    result.affectedRows === 1
      ? formatParamStructure(200, "添加宿舍成功！")
      : formatParamStructure(400, "宿舍已存在！");
});

// 获取宿舍人员
router.get("/getDormStaff", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let dorm = ctx.request.query.dorm;
  let dorm_build = await query(
    `SELECT dorm_build_name FROM dorm_build where dorm_build_manager = '${userInfo.usermark}'`
  );
  let dorm_build_name = dorm_build[0].dorm_build_name;
  let result = (await query(
    `SELECT usermark, name, sex, telephone, father, father_telephone, mother, mother_telephone, counselor, counselor_telephone
      FROM student where dorm_build = '${dorm_build_name}' and dorm = '${dorm}'
    `
  )) as Array<any>;
  ctx.body = formatParamStructure(200, "查询宿舍人员成功！", { dormStaff: result });
});

// 换宿舍
router.put("/changeDorm", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  const key = ctx.request.body.key;
  const dorm = ctx.request.body.dorm;
  const usermark = ctx.request.body.usermark;
  let reduce_population: any = {
    changedRows: 0
  };
  let dorm_build = await query(
    `SELECT dorm_build_name FROM dorm_build where dorm_build_manager = '${userInfo.usermark}'`
  );
  let dorm_build_name = dorm_build[0].dorm_build_name;

  if (key === "换宿") {
    reduce_population = (await query(`
    UPDATE student s, dorm_build db, dorm d SET d.dorm_population = d.dorm_population-1 where s.usermark = '${usermark}' and s.dorm_build = db.dorm_build_name and db.dorm_build_id = d.dorm_build_id and s.dorm = d.dorm_number
    `)) as any;
  }

  let result = (await query(
    `update student set dorm_build = '${dorm_build_name}', dorm = '${dorm}' where usermark = '${usermark}'`
  )) as any;
  let add_population = (await query(`
    UPDATE student s, dorm_build db, dorm d SET d.dorm_population = d.dorm_population+1 where s.usermark = '${usermark}' and s.dorm_build = db.dorm_build_name and db.dorm_build_id = d.dorm_build_id and s.dorm = d.dorm_number
    `)) as any;
  if (reduce_population.changedRows) {
    ctx.body =
      result.changedRows >= 1 && add_population.changedRows === 1
        ? formatParamStructure(200, "换宿舍成功!")
        : formatParamStructure(400, "换宿舍失败!");
  } else {
    ctx.body =
      result.changedRows === 1 && add_population.changedRows === 1
        ? formatParamStructure(200, "申请宿舍成功!")
        : formatParamStructure(400, "申请宿舍失败!");
  }
});

// 退宿
router.delete("/checkOut", async (ctx, next) => {
  const usermark = ctx.request.body.usermark;
  let reduce_population = (await query(`
    UPDATE student s, dorm_build db, dorm d SET d.dorm_population = d.dorm_population-1 where s.usermark = '${usermark}' and s.dorm_build = db.dorm_build_name and db.dorm_build_id = d.dorm_build_id and s.dorm = d.dorm_number
    `)) as any;
  let result = (await query(
    `update student set dorm_build = DEFAULT, dorm = DEFAULT where usermark = '${usermark}'`
  )) as any;

  ctx.body =
    result.changedRows === 1 && reduce_population.changedRows === 1
      ? formatParamStructure(200, "退宿成功!")
      : formatParamStructure(400, "退宿失败!");
});

export default router;
