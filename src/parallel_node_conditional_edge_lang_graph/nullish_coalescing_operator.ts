//these two method achieve the same thing nullish coalesching operator
//nullish coalesching operator
const func = (x: string, y: string | undefined) => {
  const result = y ?? x;
  return result;
};
//alternative method to nullish coalesching operator
const func_2 = (x: string, y: string | undefined) => {
  if (y) return y;
  return x;
};
//outputs to show same behaviour case A
const res1 = func("a", "b");
console.log("res-1", res1);
const res1_2 = func_2("a", "b");
console.log("res-1_2", res1_2);
//outputs to show same behaviour case B
const res2 = func("a", undefined);
console.log("res-2", res2);
const res2_2 = func_2("a", undefined);
console.log("res-2_2", res2_2);
