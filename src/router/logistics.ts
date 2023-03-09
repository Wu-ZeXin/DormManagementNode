import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import JWT from "../middlewares/JWT";
import { formatParamStructure, getCurrentTime } from "../utils";

const router = new KoaRouter();
router.prefix("/repair");

// 获取报修列表
router.get("/getRepairBillList", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let pageSize: any = ctx.request.query.pageSize;
  let page: any = ctx.request.query.page;
  let first_repair_type = ctx.request.query.first_repair_type;
  let secondary_repair_type = ctx.request.query.secondary_repair_type;
  let repair_dorm_build = ctx.request.query.repair_dorm_build;
  let repair_dorm = ctx.request.query.repair_dorm;
  let repair_status = ctx.request.query.repair_status;
  const dataObj = { first_repair_type, secondary_repair_type, repair_dorm_build, repair_dorm, repair_status };
  let topPageIndex: number = (page - 1) * pageSize;
  let result: any = {};
  let total: number = 0;
  if (userInfo.role === "employee") {
    if (
      first_repair_type === "" &&
      secondary_repair_type === "" &&
      repair_dorm_build === "" &&
      repair_dorm === "" &&
      repair_status === ""
    ) {
      if (userInfo.role_id === 4) {
        result = (await query(`SELECT COUNT(*) FROM repair_list where state = 1`)) as Array<any>;
        total = result[0]["COUNT(*)"];
        result = (await query(`
          SELECT repair_id, contact_person, contact_telephone, first_repair_type, secondary_repair_type,
          repair_dorm_build, repair_dorm, repair_description, repair_time, repair_status
          from repair_list where state = 1
          limit ${topPageIndex},${pageSize}
        `)) as Array<any>;
      } else {
        result = (await query(`SELECT a.repair_id from (repair_list a) INNER JOIN (dorm_build b)
          on b.dorm_build_manager = '${userInfo.usermark}' and a.repair_dorm_build = b.dorm_build_name and a.state = 1`)) as Array<any>;
        total = result.length;
        result = (await query(`
        SELECT a.repair_id, a.contact_person, a.contact_telephone, a.first_repair_type, a.secondary_repair_type,
        a.repair_dorm_build, a.repair_dorm, a.repair_description, a.repair_time, a.repair_status
        from (repair_list a)
        INNER JOIN (dorm_build b)
        on b.dorm_build_manager = '${userInfo.usermark}' and a.repair_dorm_build = b.dorm_build_name and a.state = 1
        limit ${topPageIndex},${pageSize}
      `)) as Array<any>;
      }
    } else {
      if (userInfo.role_id === 4) {
        let sql = "";
        Object.keys(dataObj)
          .filter((key: string) => {
            return dataObj[key] !== "";
          })
          .forEach((value: string, index: number) => {
            sql += `and ${value} = '${dataObj[value]}' `;
          });
        result = (await query(
          `SELECT COUNT(*) FROM repair_list where state = 1 ` + sql
        )) as Array<any>;
        total = result[0]["COUNT(*)"];
        result = (await query(
          `SELECT repair_id, contact_person, contact_telephone, first_repair_type, secondary_repair_type,
          repair_dorm_build, repair_dorm, repair_description, repair_time, repair_status
          from repair_list where state = 1 ` +
            sql +
            `limit ${topPageIndex},${pageSize}`
        )) as Array<any>;
      } else {
        let sql = "";
        Object.keys(dataObj)
          .filter((key: string) => {
            return dataObj[key] !== "";
          })
          .forEach((value: string, index: number) => {
            sql += `and a.${value} = '${dataObj[value]}' `;
          });
          console.log(sql + 1);
        result = (await query(
          `SELECT a.repair_id from (repair_list a) INNER JOIN (dorm_build b)
          on b.dorm_build_manager = '${userInfo.usermark}' and a.repair_dorm_build = b.dorm_build_name ` +
            sql +
            "and a.state = 1"
        )) as Array<any>;
        total = result.length;
        result = (await query(
          `SELECT a.repair_id, a.contact_person, a.contact_telephone, a.first_repair_type, a.secondary_repair_type,
          a.repair_dorm_build, a.repair_dorm, a.repair_description, a.repair_time, a.repair_status
          from (repair_list a) INNER JOIN (dorm_build b)
          on b.dorm_build_manager = '${userInfo.usermark}' and a.repair_dorm_build = b.dorm_build_name ` +
            sql +
            "and a.state = 1 " +
            `limit ${topPageIndex},${pageSize}`
        )) as Array<any>;
      }
    }
  } else {
    if (first_repair_type === "" && secondary_repair_type === "") {
      result = (await query(
        `SELECT COUNT(*) FROM repair_list where usermark = '${userInfo.usermark}' and state = 1`
      )) as Array<any>;
      total = result[0]["COUNT(*)"];
      result = (await query(`
        SELECT repair_id, contact_person, contact_telephone, first_repair_type, secondary_repair_type,
        repair_dorm_build, repair_dorm, repair_description, repair_time, repair_status
        from repair_list where usermark = '${userInfo.usermark}' and state = 1
        limit ${topPageIndex},${pageSize}
      `)) as Array<any>;
    } else {
      let sql = "";
      Object.keys(dataObj)
        .filter((key: string) => {
          return dataObj[key] !== "";
        })
        .forEach((value: string, index: number) => {
          if (index === 0) {
            sql += `${value} = '${dataObj[value]}' `;
          } else {
            sql += `and ${value} = '${dataObj[value]}' `;
          }
        });
      result = (await query(
        `SELECT COUNT(*) FROM repair_list where usermark = '${userInfo.usermark}' and ` +
          sql +
          "and state = 1"
      )) as Array<any>;
      total = result[0]["COUNT(*)"];
      result = (await query(
        `
        SELECT repair_id, contact_person, contact_telephone, first_repair_type, secondary_repair_type,
        repair_dorm_build, repair_dorm, repair_description, repair_time, repair_status
        from repair_list where usermark = '${userInfo.usermark}' and ` +
          sql +
          "and state = 1 " +
          `limit ${topPageIndex},${pageSize}`
      )) as Array<any>;
    }
  }
  ctx.body = formatParamStructure(200, "查询报修数据成功！", { repairBills: result, total });
});

// 添加报修单
router.post("/addRepairBill", async (ctx, next) => {
  let first_repair_type = ctx.request.body.first_repair_type;
  let secondary_repair_type = ctx.request.body.secondary_repair_type;
  let contact_person = ctx.request.body.contact_person;
  let contact_telephone = ctx.request.body.contact_telephone;
  let usermark = ctx.request.body.usermark;
  let repair_dorm_build = ctx.request.body.repair_dorm_build;
  let repair_dorm = ctx.request.body.repair_dorm;
  let repair_description = ctx.request.body.repair_description;
  let repair_time = getCurrentTime();

  let result = (await query(
    `insert into repair_list(first_repair_type, secondary_repair_type, contact_person, contact_telephone,
      usermark, repair_dorm_build, repair_dorm, repair_description, repair_time, repair_status, state) values
      ('${first_repair_type}', '${secondary_repair_type}', '${contact_person}', '${contact_telephone}', '${usermark}',
      '${repair_dorm_build}', '${repair_dorm}', '${repair_description}', '${repair_time}', 0, 1)`
  )) as any;
  ctx.body =
    result.affectedRows === 1
      ? formatParamStructure(200, "报修成功！")
      : formatParamStructure(200, "报修失败！");
});

// 修改报修单
router.put("/updateRepairBill", async (ctx, next) => {
  let repair_id = ctx.request.body.repair_id;
  let first_repair_type = ctx.request.body.first_repair_type;
  let secondary_repair_type = ctx.request.body.secondary_repair_type;
  let contact_person = ctx.request.body.contact_person;
  let contact_telephone = ctx.request.body.contact_telephone;
  let repair_dorm_build = ctx.request.body.repair_dorm_build;
  let repair_dorm = ctx.request.body.repair_dorm;
  let repair_description = ctx.request.body.repair_description;
  let result = (await query(
    `update repair_list set first_repair_type = '${first_repair_type}',
      secondary_repair_type = '${secondary_repair_type}',
      contact_person = '${contact_person}',
      contact_telephone = '${contact_telephone}',
      repair_dorm_build = '${repair_dorm_build}',
      repair_dorm = '${repair_dorm}',
      repair_description = '${repair_description}'
      where repair_id = '${repair_id}'`
  )) as any;

  ctx.body =
    result.changedRows === 1 && result.affectedRows === 1
      ? formatParamStructure(200, "修改报修单信息成功！")
      : formatParamStructure(400, "修改报修单信息失败！");
});

// 修改报修单状态
router.put("/updateRepairBillStatus", async (ctx, next) => {
  let repair_id = ctx.request.body.repair_id;
  let result = (await query(
    `update repair_list set repair_status = 1 where repair_id = '${repair_id}'`
  )) as any;
  ctx.body =
    result.changedRows === 1 &&
    result.affectedRows === 1 &&
    formatParamStructure(200, "完成报修单！");
});

// 删除报修单
router.delete("/deleteRepairBill", async (ctx, next) => {
  let repair_id = ctx.request.body.repair_id;
  let result = (await query(`DELETE from repair_list where repair_id = '${repair_id}'`)) as any;
  ctx.body =
    result.changedRows === 1
      ? formatParamStructure(200, "删除报修单成功！")
      : formatParamStructure(400, "删除报修单失败！");
});

export default router;
