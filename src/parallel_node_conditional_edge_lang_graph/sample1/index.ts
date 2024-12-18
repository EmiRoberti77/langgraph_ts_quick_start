import { START, END, StateGraph, Annotation } from "@langchain/langgraph";

const ARROW = "->";
const StateAnnotations = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
  which: Annotation<string>({
    reducer: (x: string) => x,
  }),
  name: Annotation<string>({
    reducer: (name: string) => name,
  }),
});

const nodeA = (_state: typeof StateAnnotations.State) => {
  const A = "A";
  console.log(_state.name, _state.aggregate, ARROW, A);
  return { aggregate: [A] };
};

const nodeB = (_state: typeof StateAnnotations.State) => {
  const B = "B";
  console.log(_state.name, _state.aggregate, ARROW, B);
  return { aggregate: [B] };
};

const graphBuilder = new StateGraph(StateAnnotations)
  .addNode("A", nodeA)
  .addNode("B", nodeB)
  .addEdge(START, "A")
  .addEdge("A", "B")
  .addEdge("B", END);

const graph = graphBuilder.compile();

const invokeGraph = async () => {
  const finalState = await graph.invoke({
    aggregate: ["EMI"],
    name: "emi-chain",
  });
  console.log(finalState);
};

invokeGraph();
