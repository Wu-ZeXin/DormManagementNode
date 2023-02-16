export const formatParamStructure = (code: number, msg: string, data: Record<string, any> = {}) => {
  return {
    code: code,
    msg: msg,
    data: data
  };
};
