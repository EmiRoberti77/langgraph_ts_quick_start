import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { END, MessageGraph, START } from "@langchain/langgraph";
dotenv.config();

const model = new ChatOpenAI({ temperature: 0 });
const graph = new MessageGraph();
graph.addNode("oracle", async (state: BaseMessage[]) => {
  return model.invoke(state);
});

//graph.addEdge("__start__", END);
//graph.setEntryPoint()
graph.addEdge(START, END);
const runnable = graph.compile();

runnable
  .invoke(new HumanMessage("What is 1 + 1"))
  .then((success) => console.log(success))
  .catch((err) => console.log(err));
