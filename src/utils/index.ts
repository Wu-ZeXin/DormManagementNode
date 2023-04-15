export const formatParamStructure = (code: number, msg: string, data: Record<string, any> = {}) => {
  return {
    code: code,
    msg: msg,
    data: data
  };
};
export function getCurrentMonth() {
  let date = new Date(); //当前时间
  let month = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1; //月
  return date.getFullYear() + "-" + month;
}

export function getCurrentTime() {
  function zeroFill(i) {
    if (i >= 0 && i <= 9) {
      return "0" + i;
    } else {
      return i;
    }
  }

  let date = new Date(); //当前时间
  let month = zeroFill(date.getMonth() + 1); //月
  let day = zeroFill(date.getDate()); //日
  let hour = zeroFill(date.getHours()); //时
  let minute = zeroFill(date.getMinutes()); //分
  let second = zeroFill(date.getSeconds()); //秒

  //当前时间
  let curTime =
    date.getFullYear() + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;

  return curTime;
}
