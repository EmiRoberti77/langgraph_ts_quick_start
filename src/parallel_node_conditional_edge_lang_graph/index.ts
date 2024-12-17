import { START, END, Annotation, StateGraph } from "@langchain/langgraph";

const ConditionalBranchingAnnotations = Annotation.Root({
  aggredate: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
  which: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x, //if y is defined update the value to y if not keep it to x
  }),
});

const func = (x: string, y: string | undefined) => {
  const result = y ?? x;
  return result;
};

const func_2 = (x: string, y: string | undefined) => {
  if (y) return y;
  return x;
};

const res1 = func("a", "b");
console.log("res-1", res1);
const res1_2 = func_2("a", "b");
console.log("res-1_2", res1_2);
console.log("---------------------");
const res2 = func("a", undefined);
console.log("res-2", res2);
const res2_2 = func_2("a", undefined);
console.log("res-2_2", res2_2);
