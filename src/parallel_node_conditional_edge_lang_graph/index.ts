import { START, END, Annotation, StateGraph } from "@langchain/langgraph";

const ConditionalBranchingAnnotations = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
  which: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x, //if y is defined update the value to y if not keep it to x
  }),
  name: Annotation<string>({
    reducer: () => "emi",
  }),
});

const nodeA = (_state: typeof ConditionalBranchingAnnotations.State) => {
  const IAM = "I am A ";
  console.log(_state.name, `${IAM}-to->${_state.aggregate}`);
  return { aggregate: [IAM] };
};

const nodeB = (_state: typeof ConditionalBranchingAnnotations.State) => {
  const IAM = "I am B ";
  console.log(_state.name, `${IAM}-to->${_state.aggregate}`);
  return { aggregate: [IAM] };
};

const nodeC = (_state: typeof ConditionalBranchingAnnotations.State) => {
  const IAM = "I am C ";
  console.log(_state.name, `${IAM}-to->${_state.aggregate}`);
  return { aggregate: [IAM] };
};

const nodeD = (_state: typeof ConditionalBranchingAnnotations.State) => {
  const IAM = "I am D ";
  console.log(_state.name, `${IAM}-to->${_state.aggregate}`);
  return { aggregate: [IAM] };
};

const nodeE = (_state: typeof ConditionalBranchingAnnotations.State) => {
  const IAM = "I am E ";
  console.log(_state.name, `${IAM}-to->${_state.aggregate}`);
  return { aggregate: [IAM] };
};

const routeToCDorBC = (
  _state: typeof ConditionalBranchingAnnotations.State
): string[] => {
  if (_state.which === "cd") {
    return ["C", "D"];
  }
  return ["B", "C"];
};

const graphBuilder = new StateGraph(ConditionalBranchingAnnotations)
  .addNode("A", nodeA)
  .addNode("B", nodeB)
  .addNode("C", nodeC)
  .addNode("D", nodeD)
  .addNode("E", nodeE)
  .addEdge(START, "A")
  .addConditionalEdges("A", routeToCDorBC, ["B", "C", "D"]) //third param only for visualisaztion of graph
  .addEdge("B", "E")
  .addEdge("C", "E")
  .addEdge("D", "E")
  .addEdge("E", END);

const graph = graphBuilder.compile();

const invoke = async () => {
  const finalState = await graph.invoke({ aggregate: [], which: "CD" });
  console.log(finalState);
};

invoke();
