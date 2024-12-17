import { START, END, StateGraph, Annotation } from "@langchain/langgraph/web";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

const nodeFn1 = async (_state: typeof GraphState.State) => {
  return { messages: [new HumanMessage("hello from emi")] };
};

const nodeFn2 = async (_state: typeof GraphState.State) => {
  //console.log(_state);
  return {
    messages: [new HumanMessage("Ferrari is 2025 world champions")],
  };
};

const workflow = new StateGraph(GraphState)
  .addNode("node1", nodeFn1)
  .addNode("node2", nodeFn2)
  .addEdge(START, "node1")
  .addEdge("node1", "node2")
  .addEdge("node2", END);

const app = workflow.compile();

const fState = async () => {
  const finalState = await app.invoke({
    messages: [],
  });
  //console.log(finalState.messages[finalState.messages.length - 1].content);
  console.log(
    "Final State",
    finalState.messages.map((msg) => msg.content)
  );
};

fState();
