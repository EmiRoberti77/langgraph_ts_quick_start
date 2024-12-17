import { START, END, StateGraph, Annotation } from "@langchain/langgraph/web";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

const nodeFn = async (_state: typeof GraphState.State) => {
  return { messages: [new HumanMessage("hello from emi")] };
};

const workflow = new StateGraph(GraphState)
  .addNode("node", nodeFn)
  .addEdge(START, "node")
  .addEdge("node", END);

const app = workflow.compile();

const fState = async () => {
  const finalState = await app.invoke({
    messages: [],
  });

  console.log(finalState.messages[finalState.messages.length - 1].content);
};

fState();
