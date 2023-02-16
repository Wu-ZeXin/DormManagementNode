import KoaRouter from "koa-router";
import query from "../models/MySQL"; //引入MySQL数据库
import JWT from "../middlewares/JWT";
import { formatParamStructure } from "../utils";

const router = new KoaRouter();
router.prefix("/user");

// 用户登录
router.post("/login", async (ctx, next) => {
  let usermark = ctx.request.body.userMark;
  let password = ctx.request.body.password;
  let role = ctx.request.body.userRole;

  let result = (await query(`SELECT * FROM ${role} where usermark = '${usermark}'`)) as any;

  result = JSON.parse(JSON.stringify(result));

  if (result.length > 0) {
    if (password === result[0].password) {
      ctx.body = formatParamStructure(200, "登录成功！", {
        userInfo: {
          portrait: result[0].portrait
        },
        token: JWT.sign({ usermark, role, role_id: result[0].role })
      });
    } else {
      ctx.body = formatParamStructure(400, "登陆密码错误，请重新登录！");
    }
  } else {
    ctx.body = formatParamStructure(400, "用户不存在，请重新登录！");
  }
});

// 获取用户信息
router.get("/userInfo", async (ctx, next) => {
  let result: Array<any>;
  const filed_names = {
    name: "姓名",
    sex: "性别",
    telephone: "电话",
    email: "邮箱",
    college: "学院",
    class: "班级",
    dorm: "宿舍房间",
    dorm_build: "宿舍楼",
    father: "父亲",
    father_telephone: "父亲电话",
    mother: "母亲",
    mother_telephone: "母亲电话",
    counselor: "辅导员",
    counselor_telephone: "辅导员电话"
  };
  const userInfo = JWT.verify(ctx);
  if (userInfo.role === "employee") {
    result = (await query(
      `SELECT usermark, name, sex, telephone, email FROM employee where usermark = '${userInfo.usermark}'`
    )) as Array<any>;
    if (result.length > 0) {
      ctx.body = formatParamStructure(200, "获取用户数据成功！", {
        userInfo: Object.keys(result[0]).map((key: string) => {
          if (key === "usermark") {
            return {
              filed_key: key,
              filed_value: result[0][key],
              filed_name: "职工号"
            };
          } else {
            return {
              filed_key: key,
              filed_value: result[0][key],
              filed_name: filed_names[key]
            };
          }
        })
      });
    } else {
      ctx.body = formatParamStructure(400, "获取用户数据失败！");
    }
  } else {
    result = (await query(
      `SELECT usermark, name, sex, telephone,
      email, college, class, dorm_build, dorm,
      father, father_telephone, mother, mother_telephone,
      counselor, counselor_telephone
      FROM student where usermark = '${userInfo.usermark}'`
    )) as Array<any>;
    if (result.length > 0) {
      ctx.body = formatParamStructure(200, "获取用户数据成功！", {
        userInfo: Object.keys(result[0]).map((key: string) => {
          if (key === "usermark") {
            return {
              filed_key: key,
              filed_value: result[0][key],
              filed_name: "学号"
            };
          } else {
            return {
              filed_key: key,
              filed_value: result[0][key],
              filed_name: filed_names[key]
            };
          }
        })
      });
    } else {
      ctx.body = formatParamStructure(400, "获取用户数据失败！");
    }
  }
});

// 更新用户信息
router.put("/updateUserInfo", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let result;
  let name = ctx.request.body.name;
  let sex = ctx.request.body.sex;
  let telephone = ctx.request.body.telephone;
  let email = ctx.request.body.email;
  let father = ctx.request.body.father;
  let father_telephone = ctx.request.body.father_telephone;
  let mother = ctx.request.body.mother;
  let mother_telephone = ctx.request.body.mother_telephone;
  if (userInfo.role === "employee") {
    result = await query(`update employee set
    name = '${name}',
    sex = '${sex}',
    telephone = '${telephone}',
    email = '${email}'
    where usermark = '${userInfo.usermark}'`);
  } else {
    result = await query(`update student set
    name = '${name}',
    sex = '${sex}',
    telephone = '${telephone}',
    email = '${email}',
    father = '${father}',
    father_telephone = '${father_telephone}',
    mother = '${mother}',
    mother_telephone = '${mother_telephone}'
    where usermark = '${userInfo.usermark}'`);
  }

  if (result.changedRows == 1 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(200, "更新成功！");
  } else if (result.changedRows == 0 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(100, "与原数据一致");
  } else if (result.changedRows == 0 && result.affectedRows == 0) {
    ctx.body = formatParamStructure(400, "更新失败！");
  }
});

// 修改密码
router.put("/modifyPassWord", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let password = ctx.request.body.password;
  let result = (await query(
    `update ${userInfo.role} set password = '${password}' where usermark = '${userInfo.usermark}'`
  )) as any;
  if (result.changedRows == 1 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(200, "修改成功！");
  } else if (result.changedRows == 0 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(100, "修改密码与原来一致！");
  } else if (result.changedRows == 0 && result.affectedRows == 0) {
    ctx.body = formatParamStructure(400, "修改失败！");
  }
});

// 修改用户头像
router.put("/modifyPortrait", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let portrait = ctx.request.body.portrait;
  let result = (await query(
    `update ${userInfo.role} set portrait = '${portrait}' where usermark = '${userInfo.usermark}'`
  )) as any;
  if (result.changedRows == 1 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(200, "修改成功！");
  } else if (result.changedRows == 0 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(100, "修改头像与原来一致！");
  } else if (result.changedRows == 0 && result.affectedRows == 0) {
    ctx.body = formatParamStructure(400, "修改失败！");
  }
});

export default router;
