const logPrompt = async (ctx: any, next: any) => {
  const start = new Date() as any;
  await next();
  const ms = (new Date() as any) - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
};

export default logPrompt;
