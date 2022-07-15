export const deepClone = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    if (typeof key === "object") {
      newObj[key] = deepClone(obj[key]);
      continue;
    }
    newObj[key] = obj[key];
  }
  return newObj;
};

export const evaluate = (expression: string, extraContext = "") => {
  try {
    return Function(`${extraContext}; return ${expression};`)();
  } catch (e) {
    return e.toString();
  }
};
