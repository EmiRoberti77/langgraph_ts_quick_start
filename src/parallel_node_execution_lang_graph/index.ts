import { END, START, StateGraph, Annotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  aggregate: Annotation<string>({
    reducer: (x, y) => x.concat(" ", y),
  }),
});

//create the graph
const nodeA = (_state: typeof StateAnnotation.State) => {
  const IAM = "I AM A";
  console.log(IAM, _state.aggregate);
  return { aggregate: IAM };
};

const nodeB = (_state: typeof StateAnnotation.State) => {
  const IAM = "I AM B";
  console.log(IAM, _state.aggregate);
  return { aggregate: IAM };
};

const nodeC = (_state: typeof StateAnnotation.State) => {
  const IAM = "I AM C";
  console.log(IAM, _state.aggregate);
  return { aggregate: IAM };
};

const nodeD = (_state: typeof StateAnnotation.State) => {
  const IAM = "I AM D";
  console.log(IAM, _state.aggregate);
  return { aggregate: IAM };
};

const builderGraph = new StateGraph(StateAnnotation)
  .addNode("a", nodeA)
  .addNode("b", nodeB)
  .addNode("c", nodeC)
  .addNode("d", nodeD)
  .addEdge(START, "a")
  .addEdge("a", "b")
  .addEdge("a", "c")
  .addEdge("c", "d")
  .addEdge("d", END);

const graph = builderGraph.compile();

const results = async () => {
  const baseResulst = await graph.invoke({ aggregate: "" });
  console.log("Base Results", baseResulst);
};

results();
