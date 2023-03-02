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
        item["children"].sort((el1, el2) => el1.authority_id - el2.authority_id);
      } else {
        item["children"] = [];
        item["children"].push(authority);
      }
    }
  });
};

const deleteAuthority = async (authority_id: number) => {
  let childAuthority = (await query(
    `SELECT authority_id FROM authority where authority_pid = '${authority_id}'`
  )) as Array<any>;
  if (childAuthority.length !== 0) {
    childAuthority.forEach(async item => {
      deleteAuthority(item.authority_id);
    });
  }
  let result = (await query(`
    DELETE from authority where authority_id = '${authority_id}'
  `)) as any;
  return result;
};

const integrationRouteAndOperation = (authority_set: Array<any>, authority: any) => {
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

const getUserAuthority = async (role: string, usermark: string) => {
  let role_authority_id = [];
  let add_user_authority = [];
  let delete_user_authority = [];
  let role_authority = (await query(`
    SELECT c.authority_id, c.authority_pid, c.authority_title, c.authority_name, c.authority_path, c.authority_type
    from (${role} a)
    left join (role_authority b) on a.role = b.role_id
    left join (authority c) on b.authority_id = c.authority_id
    where a.usermark = '${usermark}'
  `)) as Array<any>;
  let user_authority = (await query(`
    SELECT b.authority_id, b.authority_pid, b.authority_title, b.authority_name, b.authority_path, b.authority_type, a.status
    from (user_authority a)
    INNER JOIN (authority b)
    on a.usermark = '${usermark}' and a.authority_id = b.authority_id
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
          DELETE from user_authority where usermark = '${usermark}' and authority_id = '${item.authority_id}'
        `);
      }
    } else {
      if (item.status === 0) {
        await query(`
          DELETE from user_authority where usermark = '${usermark}' and authority_id = '${item.authority_id}'
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
  return {
    user_authority: authority,
    role_authority_length: role_authority.length,
    user_authority_length: user_authority.length
  };
};

// 查找权限
router.get("/getAuthority", async (ctx, next) => {
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
router.post("/addAuthority", async (ctx, next) => {
  let authority_id = ctx.request.body.authority_id;
  let authority_pid = ctx.request.body.authority_pid;
  let authority_title = ctx.request.body.authority_title;
  let authority_name = ctx.request.body.authority_name;
  let authority_path = ctx.request.body.authority_path;
  let authority_type = ctx.request.body.authority_type;
  let result = (await query(
    `insert into authority(authority_id, authority_pid, authority_title, authority_name, authority_path, authority_type) values('${authority_id}', '${authority_pid}', '${authority_title}', '${authority_name}', '${authority_path}', '${authority_type}')`
  )) as any;
  if (result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "添加权限成功！");
  } else {
    ctx.body = formatParamStructure(400, "添加权限失败！");
  }
});

// 修改权限
router.put("/updateAuthority", async (ctx, next) => {
  let authority_id = ctx.request.body.authority_id;
  let authority_title = ctx.request.body.authority_title;
  let authority_name = ctx.request.body.authority_name;
  let authority_path = ctx.request.body.authority_path;

  let result = (await query(
    `update authority set authority_title = '${authority_title}', authority_name = '${authority_name}', authority_path = '${authority_path}' where authority_id = '${authority_id}'`
  )) as any;
  if (result.changedRows == 1 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(200, "修改权限成功！");
  } else if (result.changedRows == 0 && result.affectedRows == 1) {
    ctx.body = formatParamStructure(100, "修改数据与原来一致！");
  } else if (result.changedRows == 0 && result.affectedRows == 0) {
    ctx.body = formatParamStructure(400, "修改权限失败！");
  }
});

// 删除权限
router.delete("/deleteAuthority", async (ctx, next) => {
  const authority_id = ctx.request.body.authority_id;
  let result = (await deleteAuthority(authority_id)) as any;
  if (result.affectedRows === 1) {
    ctx.body = formatParamStructure(200, "删除权限成功！");
  } else {
    ctx.body = formatParamStructure(400, "删除权限失败！");
  }
});

// 查找角色权限
router.get("/getRoleAuthority", async (ctx, next) => {
  const role = ctx.request.query.role;
  let result = (await query(`
    SELECT authority_id FROM role_authority where role_id = '${role}'
  `)) as Array<any>;
  let authority: Array<any> = [];
  result.forEach((item: any) => {
    authority.push(item.authority_id);
  });
  if (result.length > 0) {
    ctx.body = formatParamStructure(200, "查询角色权限成功!", { authority });
  } else {
    ctx.body = formatParamStructure(200, "角色权限尚无!", { authority });
  }
});

// 增加角色权限
router.post("/addRoleAuthority", async (ctx, next) => {
  const addParentAuthority = async (
    role_id: number,
    authority: any,
    role_authority_id: Array<number>
  ) => {
    if (role_authority_id.includes(authority.authority_pid) || authority.authority_pid === 0)
      return true;
    let parent_authority = await query(
      `SELECT authority_pid FROM authority where authority_id = '${authority.authority_pid}'`
    );
    await addParentAuthority(role_id, parent_authority[0], role_authority_id);
    let result = (await query(
      `insert into role_authority(role_id, authority_id) values('${role_id}', '${authority.authority_pid}')`
    )) as any;
    return result.affectedRows === 1 ? true : false;
  };
  const addRoleAuthority = (role_id: number, authority: any, role_authority_id: Array<number>) => {
    let sql: string = "";
    if (authority.hasOwnProperty("children")) {
      authority["children"].forEach(async child => {
        sql += addRoleAuthority(role_id, child, role_authority_id);
      });
    }
    if (role_authority_id.includes(authority.authority_id)) return sql;
    sql += `, ('${role_id}', '${authority.authority_id}')`;
    return sql;
  };
  let role_id = ctx.request.body.role_id;
  let authority = ctx.request.body.authority;
  let RoleAuthorityID = (await query(
    `SELECT authority_id FROM role_authority where role_id = '${role_id}'`
  )) as Array<any>;
  let role_authority_id: Array<any> = [];
  RoleAuthorityID.forEach(item => {
    role_authority_id.push(item.authority_id);
  });
  let addParentResult = await addParentAuthority(role_id, authority, role_authority_id);
  let addAuthoritySQL =
    "insert into role_authority(role_id, authority_id) values" +
    addRoleAuthority(role_id, authority, role_authority_id).slice(1);
  let addAuthorityResult = (await query(addAuthoritySQL)) as any;
  if (addParentResult && addAuthorityResult.affectedRows > 0) {
    ctx.body = formatParamStructure(200, "添加角色权限成功！");
  } else {
    ctx.body = formatParamStructure(400, "添加角色权限失败！");
  }
});

// 删除角色权限
router.delete("/deleteRoleAuthority", async (ctx, next) => {
  const deleteRoleAuthority = (authority: any) => {
    let sql: string = "";
    if (authority.hasOwnProperty("children")) {
      authority["children"].forEach(async child => {
        sql += deleteRoleAuthority(child);
      });
    }
    sql += `, ${authority.authority_id}`;
    return sql;
  };
  const deleteParentAuthority = async (
    role_id: number,
    authority: any,
    role_authority_id: Array<any>
  ) => {
    if (authority.authority_pid === 0) return true;
    let childAuthority = (await query(
      `SELECT authority_id from authority where authority_pid = '${authority.authority_pid}'`
    )) as Array<any>;
    let child_authority_id = [];
    childAuthority.forEach(item => {
      child_authority_id.push(item.authority_id);
    });
    let isAll = child_authority_id.some(item => {
      return role_authority_id.includes(item);
    });
    if (!isAll) {
      let parent_authority = await query(
        `SELECT authority_pid from authority where authority_id = '${authority.authority_pid}'`
      );
      let result = (await query(`
        DELETE FROM role_authority where role_id = '${role_id}' and authority_id = '${authority.authority_pid}'
      `)) as any;
      let RoleAuthorityID = (await query(
        `SELECT authority_id FROM role_authority where role_id = '${role_id}'`
      )) as Array<any>;
      let role_authority_id: Array<any> = [];
      RoleAuthorityID.forEach(item => {
        role_authority_id.push(item.authority_id);
      });
      await deleteParentAuthority(role_id, parent_authority[0], role_authority_id);
      return result.affectedRows === 1 ? true : false;
    } else {
      return true;
    }
  };
  let role_id = ctx.request.body.role_id;
  let authority = ctx.request.body.authority;
  let deleteAuthoritySQL =
    `DELETE FROM role_authority where role_id = '${role_id}' and authority_id in (` +
    deleteRoleAuthority(authority).slice(2) +
    `)`;
  let deleteResult = (await query(deleteAuthoritySQL)) as any;
  let RoleAuthorityID = (await query(
    `SELECT authority_id FROM role_authority where role_id = '${role_id}'`
  )) as Array<any>;
  let role_authority_id: Array<any> = [];
  RoleAuthorityID.forEach(item => {
    role_authority_id.push(item.authority_id);
  });
  let deleteParentResult = await deleteParentAuthority(role_id, authority, role_authority_id);
  ctx.body =
    deleteResult.affectedRows > 0 && deleteParentResult
      ? formatParamStructure(200, "删除角色权限成功！")
      : formatParamStructure(400, "删除角色权限失败！");
});

// 查询用户权限
router.get("/getUserAuthority", async (ctx, next) => {
  const userInfo = JWT.verify(ctx);
  let route_authority: Array<any> = [];
  let operation_authority: Array<any> = [];
  let { user_authority, role_authority_length, user_authority_length } = await getUserAuthority(
    userInfo.role,
    userInfo.usermark
  );
  user_authority.forEach((item: any) => {
    if (item.authority_type === 1) {
      operation_authority.push(item.authority_name);
    } else {
      if (item.authority_pid === 0) {
        route_authority.push(item);
        route_authority.sort((el1, el2) => el1.authority_id - el2.authority_id);
      } else {
        integrationAuthority(user_authority, item);
      }
    }
  });
  if (role_authority_length > 0 && user_authority_length >= 0) {
    ctx.body = formatParamStructure(200, "获取用户权限成功!", {
      route_authority,
      operation_authority
    });
  } else {
    ctx.body = formatParamStructure(400, "获取用户权限失败!");
  }
});

// 查询用户权限ID
router.get("/getUserAuthorityID", async (ctx, next) => {
  let key = ctx.request.query.key as string;
  let usermark = ctx.request.query.usermark as string;
  let user_authority_id: Array<any> = [];
  let { user_authority, role_authority_length, user_authority_length } = await getUserAuthority(
    key,
    usermark
  );
  user_authority.forEach((item: any) => {
    user_authority_id.push(item.authority_id);
  });
  if (role_authority_length > 0 && user_authority_length >= 0) {
    ctx.body = formatParamStructure(200, "获取用户权限成功!", { user_authority_id });
  } else {
    ctx.body = formatParamStructure(400, "用户权限尚无或用户不存在!");
  }
});

// 增加用户权限
router.post("/addUserAuthority", async (ctx, next) => {
  let key = ctx.request.body.key as string;
  let usermark = ctx.request.body.usermark as string;
  let authority = ctx.request.body.authority;
  let role_authority_id = [];
  let user_authority_id = [];
  let deleteResult: any = {
    affectedRows: 0
  };
  let insertResult: any = {
    affectedRows: 0
  };

  const addParentAuthority = async (
    usermark: string,
    authority: any,
    user_authority_id: Array<number>,
    role_authority_id: Array<number>
  ) => {
    if (user_authority_id.includes(authority.authority_pid) || authority.authority_pid === 0)
      return true;
    let parent_authority = await query(
      `SELECT authority_pid FROM authority where authority_id = '${authority.authority_pid}'`
    );
    await addParentAuthority(usermark, parent_authority[0], user_authority_id, role_authority_id);
    let result;
    if (role_authority_id.includes(authority.authority_pid)) {
      result = await query(`
        DELETE from user_authority where usermark = '${usermark}' and authority_id = '${authority.authority_pid}'
      `);
    } else {
      result = await query(
        `insert into user_authority(usermark, authority_id, status) values('${usermark}', '${authority.authority_pid}',  1)`
      );
    }
    return result.changedRows === 1 || result.affectedRows === 1 ? true : false;
  };
  const addUserAuthority = (
    usermark: string,
    authority: any,
    user_authority_id: Array<number>,
    role_authority_id: Array<number>
  ) => {
    let deleteAuthoritySQL: string = "";
    let insertAuthoritySQL: string = "";
    if (authority.hasOwnProperty("children")) {
      authority["children"].forEach(async child => {
        const { deleteAuthoritySQL: childDelete, insertAuthoritySQL: childInsert } =
          addUserAuthority(usermark, child, user_authority_id, role_authority_id);
        deleteAuthoritySQL += childDelete;
        insertAuthoritySQL += childInsert;
      });
    }
    if (user_authority_id.includes(authority.authority_id)) {
      return {
        deleteAuthoritySQL,
        insertAuthoritySQL
      };
    }
    if (role_authority_id.includes(authority.authority_id)) {
      deleteAuthoritySQL += `, ${authority.authority_id}`;
    } else {
      insertAuthoritySQL += `, ('${usermark}', '${authority.authority_id}',  1)`;
    }
    return {
      deleteAuthoritySQL,
      insertAuthoritySQL
    };
  };

  let role_authority = (await query(`
    SELECT c.authority_id, c.authority_pid, c.authority_title, c.authority_name, c.authority_path, c.authority_type
    from (employee a)
    left join (role_authority b) on a.role = b.role_id
    left join (authority c) on b.authority_id = c.authority_id
    where a.usermark = '${usermark}'
  `)) as Array<any>;
  role_authority.forEach((item: any) => {
    role_authority_id.push(item.authority_id);
  });
  let { user_authority } = await getUserAuthority(key, usermark);
  user_authority.forEach((item: any) => {
    user_authority_id.push(item.authority_id);
  });
  let addParentResult = await addParentAuthority(
    usermark,
    authority,
    user_authority_id,
    role_authority_id
  );
  let { deleteAuthoritySQL, insertAuthoritySQL } = addUserAuthority(
    usermark,
    authority,
    user_authority_id,
    role_authority_id
  );
  if (deleteAuthoritySQL !== "") {
    let deleteSQL =
      `DELETE FROM user_authority where usermark = '${usermark}' and authority_id in (` +
      deleteAuthoritySQL.slice(2) +
      `)`;
    deleteResult = await query(deleteSQL);
  }
  if (insertAuthoritySQL !== "") {
    let insertSQL =
      "insert into user_authority(usermark, authority_id, status) values" +
      insertAuthoritySQL.slice(1);
    insertResult = await query(insertSQL);
  }
  if (addParentResult) {
    ctx.body =
      deleteResult.affectedRows > 0 || insertResult.affectedRows > 0
        ? formatParamStructure(200, "增加用户权限成功！")
        : formatParamStructure(400, "增加用户权限失败！");
  } else {
    ctx.body = formatParamStructure(400, "增加用户权限失败！");
  }
});

// 删除用户权限
router.delete("/deleteUserAuthority", async (ctx, next) => {
  let key = ctx.request.body.key as string;
  let usermark = ctx.request.body.usermark;
  let authority = ctx.request.body.authority;
  let role_authority_id = [];
  let user_authority_id = [];
  let deleteResult: any = {
    affectedRows: 0
  };
  let insertResult: any = {
    affectedRows: 0
  };

  const deleteUserAuthority = (
    usermark: string,
    authority: any,
    role_authority_id: Array<number>
  ) => {
    let deleteAuthoritySQL: string = "";
    let insertAuthoritySQL: string = "";
    if (authority.hasOwnProperty("children")) {
      authority["children"].forEach(async child => {
        const { deleteAuthoritySQL: childDelete, insertAuthoritySQL: childInsert } =
          deleteUserAuthority(usermark, child, role_authority_id);
        deleteAuthoritySQL += childDelete;
        insertAuthoritySQL += childInsert;
      });
    }
    if (role_authority_id.includes(authority.authority_id)) {
      insertAuthoritySQL += `, ('${usermark}', '${authority.authority_id}',  0)`;
    } else {
      deleteAuthoritySQL += `, ${authority.authority_id}`;
    }
    return {
      deleteAuthoritySQL,
      insertAuthoritySQL
    };
  };
  const deleteParentAuthority = async (
    usermark: string,
    key: string,
    authority: any,
    user_authority_id: Array<number>,
    role_authority_id: Array<number>
  ) => {
    if (authority.authority_pid === 0) return true;
    let childAuthority = (await query(
      `SELECT authority_id from authority where authority_pid = '${authority.authority_pid}'`
    )) as Array<any>;
    let child_authority_id = [];
    childAuthority.forEach(item => {
      child_authority_id.push(item.authority_id);
    });
    let isAll = child_authority_id.some(item => {
      return user_authority_id.includes(item);
    });
    if (!isAll) {
      let parent_authority = await query(
        `SELECT authority_pid from authority where authority_id = '${authority.authority_pid}'`
      );
      let result;
      if (role_authority_id.includes(authority.authority_pid)) {
        result = (await query(
          `insert into user_authority(usermark, authority_id, status) values('${usermark}', '${authority.authority_pid}',  0)`
        )) as any;
      } else {
        result = await query(`
          DELETE from user_authority where usermark = '${usermark}' and authority_id = '${authority.authority_pid}'
        `);
      }
      let user_authority_id: Array<any> = [];
      let { user_authority } = await getUserAuthority(key, usermark);
      user_authority.forEach((item: any) => {
        user_authority_id.push(item.authority_id);
      });
      await deleteParentAuthority(
        usermark,
        key,
        parent_authority[0],
        user_authority_id,
        role_authority_id
      );
      return result.changedRows === 1 || result.affectedRows === 1 ? true : false;
    } else {
      return true;
    }
  };

  let role_authority = (await query(`
    SELECT c.authority_id, c.authority_pid, c.authority_title, c.authority_name, c.authority_path, c.authority_type
    from (employee a)
    left join (role_authority b) on a.role = b.role_id
    left join (authority c) on b.authority_id = c.authority_id
    where a.usermark = '${usermark}'
  `)) as Array<any>;
  role_authority.forEach((item: any) => {
    role_authority_id.push(item.authority_id);
  });
  let { deleteAuthoritySQL, insertAuthoritySQL } = deleteUserAuthority(usermark, authority, role_authority_id);
  if (deleteAuthoritySQL !== "") {
    let deleteSQL =
      `DELETE FROM user_authority where usermark = '${usermark}' and authority_id in (` +
      deleteAuthoritySQL.slice(2) +
      `)`;
    deleteResult = await query(deleteSQL);
  }
  if (insertAuthoritySQL !== "") {
    let insertSQL =
      "insert into user_authority(usermark, authority_id, status) values" +
      insertAuthoritySQL.slice(1);
    insertResult = await query(insertSQL);
  }
  let { user_authority } = await getUserAuthority(key, usermark);
  user_authority.forEach((item: any) => {
    user_authority_id.push(item.authority_id);
  });
  let deleteParentResult = await deleteParentAuthority(
    usermark,
    key,
    authority,
    user_authority_id,
    role_authority_id
  );
  if(deleteParentResult) {
    ctx.body =
      deleteResult.affectedRows > 0 || insertResult.affectedRows > 0
        ? formatParamStructure(200, "删除用户权限成功！")
        : formatParamStructure(400, "删除用户权限失败！");
  } else {
    ctx.body = formatParamStructure(400, "删除用户权限失败！");
  }
});

export default router;
