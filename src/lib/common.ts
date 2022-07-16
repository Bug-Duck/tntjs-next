/**
 * Deep clone an object.
 * @param obj Object to clone.
 * @returns Deep cloned object.
 */
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

/**
 * Evaluate an expression.
 * @param expression Expression to evaluate its value.
 * @param extraContext Some extra context to inject.
 * @returns Evaluated result or error message.
 */
export const evaluate = (expression: string, extraContext = "") => {
  try {
    return Function(`${extraContext}; return ${expression};`)();
  } catch (e) {
    return e.toString();
  }
};
