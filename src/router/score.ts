import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import { formatParamStructure } from "../utils";

const router = new KoaRouter();
router.prefix("/score");

// 获取评分列表
router.get("/getScore", async (ctx, next) => {
  let score_month = ctx.request.query.score_month;
  let pageSize: any = ctx.request.query.pageSize;
  let page: any = ctx.request.query.page;

  let total: number = 0;
  let result: Array<any>;
  if (page >= 1) {
    let topPageIndex: number = (page - 1) * pageSize;
    result = (await query(
      `SELECT COUNT(*) FROM dorm_score where score_month = '${score_month}'`
    )) as Array<any>;
    total = result[0]["COUNT(*)"];
    result = (await query(`
      SELECT id, dorm_build, dorm_number, hygiene_score, tidy_score, safety_score, behavior_score, score_month
      from dorm_score where score_month = '${score_month}'
      limit ${topPageIndex},${pageSize}
    `)) as Array<any>;
  } else {
    result = (await query(`
      SELECT id, dorm_build, dorm_number, hygiene_score, tidy_score, safety_score, behavior_score, score_month
      from dorm_score where score_month = '${score_month}'
    `)) as Array<any>;
  }

  ctx.body = formatParamStructure(200, "查询评分成功！", { scoreInfo: result, total });
});

// 添加评分
router.post("/addScore", async (ctx, next) => {
  let dorm_build = ctx.request.body.dorm_build;
  let dorm_number = ctx.request.body.dorm_number;
  let hygiene_score = ctx.request.body.hygiene_score;
  let tidy_score = ctx.request.body.tidy_score;
  let safety_score = ctx.request.body.safety_score;
  let behavior_score = ctx.request.body.behavior_score;
  let score_month = ctx.request.body.score_month;

  let result = (await query(
    `insert into dorm_score(dorm_build, dorm_number, hygiene_score, tidy_score, safety_score, behavior_score, score_month) values ('${dorm_build}', '${dorm_number}', '${hygiene_score}', '${tidy_score}', '${safety_score}', '${behavior_score}', '${score_month}')`
  )) as any;
  if (result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "添加评分成功！");
  } else {
    ctx.body = formatParamStructure(400, "添加评分失败！");
  }
});

// 批量添加评分
router.post("/addScores", async (ctx, next) => {
  let uploadData = ctx.request.body.uploadData as Array<any>;
  let sql = "";
  uploadData.forEach((item: any, index: number) => {
    if (index === 0) {
      sql += `('${item.dorm_build}', '${item.dorm_number}', '${item.hygiene_score}', '${item.tidy_score}', '${item.safety_score}', '${item.behavior_score}', '${item.score_month}')`;
    } else {
      sql += `,('${item.dorm_build}', '${item.dorm_number}', '${item.hygiene_score}', '${item.tidy_score}', '${item.safety_score}', '${item.behavior_score}', '${item.score_month}')`;
    }
  });
  let result = (await query(
    `insert into dorm_score(dorm_build, dorm_number, hygiene_score, tidy_score, safety_score, behavior_score, score_month) values ` +
      sql
  )) as any;
  if (result.affectedRows > 0) {
    ctx.body = formatParamStructure(200, "添加评分成功！");
  } else {
    ctx.body = formatParamStructure(400, "添加评分失败！");
  }
});

// 修改评分
router.put("/updateScore", async (ctx, next) => {
  let id = ctx.request.body.id;
  let dorm_build = ctx.request.body.dorm_build;
  let dorm_number = ctx.request.body.dorm_number;
  let hygiene_score = ctx.request.body.hygiene_score;
  let tidy_score = ctx.request.body.tidy_score;
  let safety_score = ctx.request.body.safety_score;
  let behavior_score = ctx.request.body.behavior_score;
  let score_month = ctx.request.body.score_month;

  let result = (await query(
    `update dorm_score set dorm_build = '${dorm_build}', dorm_number = '${dorm_number}', hygiene_score = '${hygiene_score}', tidy_score = '${tidy_score}', safety_score = '${safety_score}', behavior_score = '${behavior_score}', score_month = '${score_month}' where id = '${id}'`
  )) as any;
  if (result.changedRows === 1 && result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "更新评分成功！");
  } else {
    ctx.body = formatParamStructure(400, "更新评分失败！");
  }
});

// 删除评分
router.delete("/deleteScore", async (ctx, next) => {
  let id = ctx.request.body.id;
  let result = (await query(`DELETE from dorm_score where id = '${id}'`)) as any;
  console.log(result);
  if (result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "删除评分成功！");
  } else {
    ctx.body = formatParamStructure(400, "删除评分失败！");
  }
});

export default router;
