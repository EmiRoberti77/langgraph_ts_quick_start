import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import {
  StateGraph,
  MemorySaver,
  Annotation,
  messagesStateReducer,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const MODEL_NAME = "gpt-4o";
const MODEL_TEMP = 0.2;

//define Root State Annotations
const StateAnnotations = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    //append new messages to the list and overwrite messages with same thread_id
    reducer: messagesStateReducer,
  }),
});

// Define the tools for the agent to use
const weatherTool = tool(
  async ({ query }) => {
    // This is a placeholder for the actual implementation
    if (
      query.toLowerCase().includes("sf") ||
      query.toLowerCase().includes("san francisco")
    ) {
      return "It's 60 degrees and foggy.";
    }
    return "It's 90 degrees and sunny.";
  },
  {
    name: "weather",
    description: "Call to get the current weather for a location.",
    schema: z.object({
      query: z.string().describe("The query to use in your search."),
    }),
  }
);

const tools = [weatherTool];
const toolNode = new ToolNode(tools);

const model = new ChatOpenAI({
  model: MODEL_NAME,
  temperature: MODEL_TEMP,
}).bindTools(tools);

function shouldContinue(_state: typeof StateAnnotations.State) {
  const messages = _state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls?.length) {
    console.log("return __tools__");
    return "__tools__";
  }
  console.log("return __end__");
  return END;
}

async function CallModel(_state: typeof StateAnnotations.State) {
  const response = await model.invoke(_state.messages);
  return {
    messages: [response],
  };
}

//define the graph
const workflow = new StateGraph(StateAnnotations)
  .addNode("__agent__", CallModel)
  .addNode("__tools__", toolNode)
  .addEdge(START, "__agent__")
  .addConditionalEdges("__agent__", shouldContinue)
  .addEdge("__tools__", "__agent__")
  .addEdge("__agent__", END);

const checkpointer = new MemorySaver();
const app = workflow.compile({ checkpointer });

async function run() {
  const finalState = await app.invoke(
    { messages: [new HumanMessage("what is the weather in sf")] },
    { configurable: { thread_id: "emi-77" } }
  );

  //console.log(finalState);
  console.log(finalState.messages[finalState.messages.length - 1].content);
}

run();
