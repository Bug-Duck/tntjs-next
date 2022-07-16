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
 * @param shouldExecuate Whether or not to execuate the generated function.
 * @returns Evaluated result or error message.
 */
export const evaluate = (
  expression: string,
  extraContext = "",
  shouldExecuate = true
) => {
  try {
    const func = Function(`${extraContext}; return ${expression};`);
    return shouldExecuate ? func() : func;
  } catch (e) {
    return e.toString();
  }
};
