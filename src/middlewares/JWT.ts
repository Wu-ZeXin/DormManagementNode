import jwt from "jsonwebtoken";
const PRIVATE_KEY = "NINE_DRAGONS_PAPER";

interface TokenType {
  usermark: string;
  role: string;
  role_id: number;
  signTime: number;
  timeout: number;
  iat: number;
  exp: number;
}

class JWT {
  sign(user: any) {
    return jwt.sign(
      {
        ...user,
        signTime: new Date().getTime(),
        timeout: 1000 * 60 * 60 * 2
      },
      PRIVATE_KEY
    );
  }

  verify(ctx: any) {
    const authorization = ctx.headers.authorization;
    const token = authorization.replace("Bearer ", "");

    return jwt.verify(token, PRIVATE_KEY) as TokenType;
  }
}

const token = function () {
  return new JWT();
};

export default token();
