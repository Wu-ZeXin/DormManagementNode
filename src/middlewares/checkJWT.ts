import JWT from "../middlewares/JWT";

const checkJWT = async (ctx: any, next: any) => {
  let url = ctx.url.split("?")[0];
  let WHITE_URL = ["/user/login", "/user/forgetPassword"];
  if (WHITE_URL.includes(url)) {
    await next();
  } else {
    // 否则获取到token
    const token = ctx.headers.authorization.replace("Bearer ", "");

    if (token) {
      // 如果有token的话就开始解析
      const tokenItem = JWT.verify(ctx);
      // 将token的创建的时间和过期时间解构出来
      const { signTime, timeout } = tokenItem;
      // 拿到当前的时间
      let currentTime = new Date().getTime();
      // 判断一下如果当前时间减去token创建时间小于或者等于token过期时间，说明还没有过期，否则过期
      if (currentTime - signTime <= timeout) {
        // token没有过期
        await next();
      } else {
        ctx.body = {
          code: 401,
          msg: "登录过期，请重新登录!"
        };
      }
    } else {
      ctx.body = {
        code: 401,
        msg: "请带上Token！"
      };
    }
  }
};

export default checkJWT;
