import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import * as crypto from "crypto";
import { formatParamStructure } from "../utils";

const router = new KoaRouter();
router.prefix("/userInfo");

// 获取职工信息
router.get("/getEmployee", async (ctx, next) => {
  let usermark = ctx.request.query.usermark;
  let role = ctx.request.query.role;
  let pageSize: any = ctx.request.query.pageSize;
  let page: any = ctx.request.query.page;
  let topPageIndex: number = (page - 1) * pageSize;
  let total: number;
  let result: Array<any>;
  if (usermark === "" && role === "") {
    result = (await query(
      "SELECT COUNT(*) FROM employee where usermark <> 'admin' and state = 1"
    )) as Array<any>;
    total = result[0]["COUNT(*)"];
    result = (await query(`
      SELECT a.usermark, a.name, a.sex, a.telephone, a.email, b.role_name
      from (employee a)
      INNER JOIN (role b)
      where a.usermark <> 'admin' and a.state = 1 and a.role = b.role_id
      limit ${topPageIndex},${pageSize}
    `)) as Array<any>;
  } else {
    if (usermark === "" && role !== "") {
      result = (await query(`
        SELECT COUNT(*) FROM employee where role = '${role}' and state = 1
      `)) as Array<any>;
      total = result[0]["COUNT(*)"];
      result = (await query(`
        SELECT a.usermark, a.name, a.sex, a.telephone, a.email, b.role_name
        from (employee a)
        INNER JOIN (role b)
        on a.role = '${role}' and a.state = 1 and a.role = b.role_id
        limit ${topPageIndex},${pageSize}
      `)) as Array<any>;
    } else if (role === "" && usermark !== "") {
      result = (await query(`
        SELECT a.usermark, a.name, a.sex, a.telephone, a.email, b.role_name
        from (employee a)
        INNER JOIN (role b)
        on a.usermark = '${usermark}' and a.state = 1 and a.role = b.role_id
        limit ${topPageIndex},${pageSize}
      `)) as Array<any>;
      total = result.length;
    } else {
      result = (await query(`
        SELECT a.usermark, a.name, a.sex, a.telephone, a.email, b.role_name
        from (employee a)
        INNER JOIN (role b)
        on a.usermark = '${usermark}' and a.role = '${role}' and a.state = 1 and a.role = b.role_id
        limit ${topPageIndex},${pageSize}
      `)) as Array<any>;
      total = result.length;
    }
  }
  if (result.length > 0) {
    ctx.body = formatParamStructure(200, "获取职工信息成功!", { total, employeeData: result });
  } else {
    ctx.body = formatParamStructure(200, "数据不存在!");
  }
});

// 删除职工信息
router.delete("/deleteEmployee", async (ctx, next) => {
  let usermark = ctx.request.body.usermark;
  let result = (await query(`update employee set state = 0 where usermark = '${usermark}'`)) as any;
  if (result.changedRows == 1) {
    ctx.body = formatParamStructure(200, "删除职工信息成功!");
  } else {
    ctx.body = formatParamStructure(400, "删除职工信息失败!");
  }
});

// 添加职工信息
router.post("/addEmployee", async (ctx, next) => {
  const date = new Date();
  let usermark =
    "E" +
    date.getFullYear().toString().slice(2) +
    (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1).toString()) +
    (date.getDate() < 10 ? "0" + date.getDate() : date.getDate().toString()) +
    (date.getHours() < 10 ? "0" + date.getHours() : date.getHours().toString()) +
    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes().toString()) +
    (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds().toString());
  let password = crypto.createHash("md5").update(usermark).digest("hex");
  let name = ctx.request.body.name;
  let sex = ctx.request.body.sex;
  let telephone = ctx.request.body.telephone;
  let email = ctx.request.body.email;
  let role = ctx.request.body.role;
  let result = (await query(
    `insert into employee(usermark, password, name, sex, telephone, email, role, state) values('${usermark}', '${password}', '${name}', '${sex}', '${telephone}', '${email}', '${role}', 1)`
  )) as any;
  if (result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "添加职工信息成功！");
  } else {
    ctx.body = formatParamStructure(400, "添加职工信息失败！");
  }
});

// 修改职工信息
router.put("/updateEmployee", async (ctx, next) => {
  let usermark = ctx.request.body.usermark;
  let name = ctx.request.body.name;
  let sex = ctx.request.body.sex;
  let telephone = ctx.request.body.telephone;
  let email = ctx.request.body.email;
  let role = ctx.request.body.role_name;
  if (typeof role === "string") {
    let result = await query(`SELECT role_id FROM role where role_name = '${role}'`);
    role = result[0].role_id;
  }
  let result = (await query(
    `update employee set name = '${name}', sex = '${sex}', telephone = '${telephone}', email = '${email}', role = '${role}' where usermark = '${usermark}'`
  )) as any;
  if (result.changedRows == 1 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(200, "修改职工信息成功！");
  } else if (result.changedRows == 0 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(100, "修改密数据与原来一致！");
  } else if (result.changedRows == 0 && result.affectedRows == 0) {
    ctx.body = formatParamStructure(400, "修改职工信息失败！");
  }
});

// 获取学生信息
router.get("/getStudent", async (ctx, next) => {
  let usermark = ctx.request.query.usermark;
  let name = ctx.request.query.name;
  let college = ctx.request.query.college;
  let grade = ctx.request.query.class;
  let dorm_build = ctx.request.query.dorm_build;
  let dorm = ctx.request.query.dorm;
  const dataObj = { usermark, name, college, class: grade, dorm_build, dorm };
  let pageSize: any = ctx.request.query.pageSize;
  let page: any = ctx.request.query.page;
  let topPageIndex: number = (page - 1) * pageSize;
  let total: number;
  let result: Array<any>;
  if (
    usermark === "" &&
    name === "" &&
    college === "" &&
    grade === "" &&
    dorm_build === "" &&
    dorm === ""
  ) {
    result = (await query("SELECT COUNT(*) FROM student where state = 1")) as Array<any>;
    total = result[0]["COUNT(*)"];
    result = (await query(`
      SELECT usermark, name, sex, telephone, email, college, class, dorm_build, dorm,
      father, father_telephone, mother, mother_telephone, counselor, counselor_telephone
      FROM student where state = 1
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
      `SELECT usermark, name, sex, telephone, email, college, class, dorm, dorm_build,
      father, father_telephone, mother, mother_telephone, counselor, counselor_telephone
      FROM student where ` +
        sql +
        "and state = 1"
    )) as Array<any>;
    total = result.length;
    result = (await query(
      `SELECT usermark, name, sex, telephone, email, college, class, dorm, dorm_build,
    father, father_telephone, mother, mother_telephone, counselor, counselor_telephone
    FROM student where ` +
        sql +
        "and state = 1 " +
        `limit ${topPageIndex},${pageSize}`
    )) as Array<any>;
  }
  if (result.length > 0) {
    ctx.body = formatParamStructure(200, "获取学生信息成功!", { total, studentData: result });
  } else {
    ctx.body = formatParamStructure(200, "数据不存在!", { total: 0, studentData: result });
  }
});

// 删除学生信息
router.delete("/deleteStudent", async (ctx, next) => {
  let usermark = ctx.request.body.usermark;
  let dorm_population = await query(`
    UPDATE student s, dorm_build db, dorm d SET d.dorm_population = d.dorm_population-1 where s.usermark = '${usermark}' and s.dorm_build = db.dorm_build_name and db.dorm_build_id = d.dorm_build_id and s.dorm = d.dorm_number
    `);
  let result = (await query(`update student set state = 0 where usermark = '${usermark}'`)) as any;
  if (result.changedRows == 1) {
    ctx.body = formatParamStructure(200, "删除学生信息成功!");
  } else {
    ctx.body = formatParamStructure(400, "删除学生信息失败!");
  }
});

// 修改学生信息
router.put("/updateStudent", async (ctx, next) => {
  let usermark = ctx.request.body.usermark;
  let name = ctx.request.body.name;
  let sex = ctx.request.body.sex;
  let telephone = ctx.request.body.telephone;
  let email = ctx.request.body.email;
  let college = ctx.request.body.college;
  let grade = ctx.request.body.class;
  let dorm_build = ctx.request.body.dorm_build;
  let dorm = ctx.request.body.dorm;
  let father = ctx.request.body.father;
  let father_telephone = ctx.request.body.father_telephone;
  let mother = ctx.request.body.mother;
  let mother_telephone = ctx.request.body.mother_telephone;
  let counselor = ctx.request.body.counselor;
  let counselor_telephone = ctx.request.body.counselor_telephone;
  let changeDorm: any = { changedRows: 0 };

  let before_dorm = await query(`SELECT dorm from student where usermark = '${usermark}'`);
  if (before_dorm[0].dorm !== dorm) {
    changeDorm = await query(`
      UPDATE student s, dorm_build db, dorm d SET d.dorm_population = d.dorm_population-1 where s.usermark = '${usermark}' and s.dorm_build = db.dorm_build_name and db.dorm_build_id = d.dorm_build_id and s.dorm = d.dorm_number
    `);
  }
  let result = (await query(
    `update student set
      name = '${name}', sex = '${sex}', telephone = '${telephone}', email = '${email}', college = '${college}', class = '${grade}',
      dorm_build = '${dorm_build}', dorm = '${dorm}', father = '${father}', father_telephone = '${father_telephone}', mother = '${mother}',
      mother_telephone = '${mother_telephone}', counselor = '${counselor}', counselor_telephone = '${counselor_telephone}'
    where usermark = '${usermark}'`
  )) as any;
  if (changeDorm.changedRows === 1) {
    await query(`
      UPDATE student s, dorm_build db, dorm d SET d.dorm_population = d.dorm_population+1 where s.usermark = '${usermark}' and s.dorm_build = db.dorm_build_name and db.dorm_build_id = d.dorm_build_id and s.dorm = d.dorm_number
    `);
  }
  if (result.changedRows == 1 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(200, "修改学生信息成功！");
  } else if (result.changedRows == 0 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(100, "修改数据与原来一致！");
  } else if (result.changedRows == 0 && result.affectedRows == 0) {
    ctx.body = formatParamStructure(400, "修改学生信息失败！");
  }
});

// 添加学生
router.post("/addStudent", async (ctx, next) => {
  let name = ctx.request.body.name;
  let sex = ctx.request.body.sex;
  let telephone = ctx.request.body.telephone;
  let email = ctx.request.body.email;
  let college = ctx.request.body.college;
  let grade = ctx.request.body.class;
  let dorm_build = ctx.request.body.dorm_build;
  let dorm = ctx.request.body.dorm;
  let counselor = ctx.request.body.counselor;
  let counselor_telephone = ctx.request.body.counselor_telephone;
  const date = new Date();
  let usermark =
    "S" +
    date.getFullYear().toString().slice(2) +
    (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1).toString()) +
    (date.getDate() < 10 ? "0" + date.getDate() : date.getDate().toString()) +
    (date.getHours() < 10 ? "0" + date.getHours() : date.getHours().toString()) +
    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes().toString()) +
    (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds().toString());
  let password = crypto.createHash("md5").update(usermark).digest("hex");
  let result = (await query(
    `insert into student(usermark, password, name, sex, telephone, email, college, class, dorm, dorm_build, counselor, counselor_telephone, role, state)
    values('${usermark}', '${password}', '${name}', '${sex}', '${telephone}', '${email}', '${college}', '${grade}', '${dorm}', '${dorm_build}', '${counselor}', '${counselor_telephone}', 5, 1)`
  )) as any;
  await query(`
    UPDATE dorm_build db, dorm d SET d.dorm_population = d.dorm_population+1 where db.dorm_build_name = '${dorm_build}' and db.dorm_build_id = d.dorm_build_id and d.dorm_number = '${dorm}'
  `);
  if (result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "添加学生信息成功！");
  } else {
    ctx.body = formatParamStructure(400, "添加学生信息失败！");
  }
});
export default router;
