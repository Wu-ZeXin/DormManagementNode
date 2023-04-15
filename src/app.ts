import dotenv from "dotenv";
dotenv.config();

import Koa from "koa";
import koaBody from "koa-body";
import { HttpMethodEnum } from "koa-body";
import cors from "koa2-cors";
import { Server } from "http";

import config from "./config/env";
import logPrompt from "./middlewares/logPrompt";
import checkJWT from "./middlewares/checkJWT";
import checkAuthority from "./middlewares/checkAuthority";

// 引入路由
import user from "./router/user";
import authority from "./router/authority";
import common from "./router/common";
import userInfo from "./router/userInfo";
import role from "./router/role";
import dormBuild from "./router/dormBuild";
import dorm from "./router/dorm";
import logistics from "./router/logistics";
import score from "./router/score";

// 创建服务对象
const app = new Koa();

// 引入中间件
app.use(cors());
app.use(
  koaBody({
    parsedMethods: [
      HttpMethodEnum.POST,
      HttpMethodEnum.PUT,
      HttpMethodEnum.PATCH,
      HttpMethodEnum.DELETE
    ]
  })
);
app.use(logPrompt);
app.use(checkJWT);
app.use(checkAuthority);

// 使用路由
app.use(user.routes());
app.use(user.allowedMethods());
app.use(authority.routes());
app.use(authority.allowedMethods());
app.use(common.routes());
app.use(common.allowedMethods());
app.use(userInfo.routes());
app.use(userInfo.allowedMethods());
app.use(role.routes());
app.use(role.allowedMethods());
app.use(dormBuild.routes());
app.use(dormBuild.allowedMethods());
app.use(dorm.routes());
app.use(dorm.allowedMethods());
app.use(logistics.routes());
app.use(logistics.allowedMethods());
app.use(score.routes());
app.use(score.allowedMethods());

// 启动服务
const runServer = (port: number): Server => {
  console.log("Server running on port 8090");
  return app.listen(port);
};

runServer(config.server.port);
