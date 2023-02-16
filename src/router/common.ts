import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import JWT from "../middlewares/JWT";
import { formatParamStructure } from "../utils";

const router = new KoaRouter();
router.prefix("/common");

// 获取职工的职工号和姓名做选项
router.get("/getOption", async (ctx, next) => {
  let key = ctx.request.query.key;
  let selectKey = ctx.request.query.selectKey;
  let result: any;
  if (key === "employee") {
    if(selectKey === "") {
      result = (await query(
        `SELECT usermark, name FROM employee where usermark <> 'admin'`
      )) as Array<any>;
    } else {
      result = (await query(
        `SELECT usermark, name FROM employee where usermark = '${selectKey}' or name = '${selectKey}'`
      )) as Array<any>;
    }
  } else if (key === "role") {
    result = (await query(
      `SELECT role_id, role_name FROM role where role_name <> '学生'`
    )) as Array<any>;
  } else if( key === "college") {
    result = (await query(
      `SELECT college_name FROM college`
    )) as Array<any>;
  } else if( key === "dorm_build") {
    result = (await query(
      `SELECT dorm_build_name FROM dorm_build`
    )) as Array<any>;
  }
  if (result.length > 0) {
    ctx.body = formatParamStructure(200, "获取成功!", { selectOptions: result });
  } else {
    ctx.body = formatParamStructure(400, "获取失败!");
  }
});

export default router;
