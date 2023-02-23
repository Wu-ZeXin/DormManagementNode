import JWT from "../middlewares/JWT";
import { formatParamStructure } from "../utils";

const checkAuthority = async (ctx: any, next: any) => {
  let url = ctx.url.split("?")[0];
  let CHECK_URL = [
    "/userInfo/getEmployee",
    "/userInfo/deleteEmployee",
    "/userInfo/addEmployee",
    "/userInfo/updateEmployee",
    "/userInfo/getStudent",
    "/userInfo/deleteStudent",
    "/userInfo/updateStudent",
    "/userInfo/addStudent",
    "/authority/getAuthority",
    "/authority/addAuthority",
    "/authority/updateAuthority",
    "/authority/deleteAuthority",
    "/authority/getRoleAuthority",
    "/authority/addRoleAuthority",
    "/authority/deleteRoleAuthority",
    "/authority/getUserAuthorityID",
    "/authority/addUserAuthority",
    "/authority/deleteUserAuthority",
    "/role/getRole",
    "/role/addRole",
    "/role/updateRole",
    "/role/deleteRole"
  ];
  let ROLE_ID = [1, 2];
  if (CHECK_URL.includes(url)) {
    const userInfo = JWT.verify(ctx);
    if (!ROLE_ID.includes(userInfo.role_id)) {
      ctx.body = formatParamStructure(403, "无权限！");
    } else {
      await next();
    }
  } else {
    await next();
  }
};

export default checkAuthority;
