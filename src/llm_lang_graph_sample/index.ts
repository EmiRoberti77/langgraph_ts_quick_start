import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
  StateGraph,
  MemorySaver,
  Annotation,
  messagesStateReducer,
  START,
  END,
} from "@langchain/langgraph";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const DEBUG = false;
const OPEN_AI_TEXT_EMB_3_SMALL = "text-embedding-3-small";
const MODEL_NAME = "gpt-4o";
const MODEL_TEMP = 0.2;

const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

const StateAnnotations = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer, // append new messages
  }),
  prompt: Annotation<string>(),
  nameSpace: Annotation<string>(),
  indexName: Annotation<string>(),
});

const pineConeTool = async (_state: typeof StateAnnotations.State) => {
  if (DEBUG) console.log("In Pinecone Tool");
  const embedding = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    batchSize: 100,
    model: OPEN_AI_TEXT_EMB_3_SMALL,
  });

  const index = pinecone.Index(_state.indexName);
  const embeddedPrompt = await embedding.embedQuery(_state.prompt);
  const result = await index.namespace(_state.nameSpace).query({
    vector: embeddedPrompt,
    topK: 3,
    includeMetadata: true,
  });
  const mappedResult = result.matches.map((item) => item.metadata?.text + "\n");
  if (DEBUG) console.log("Mapped Result:", mappedResult);
  return {
    messages: [new AIMessage(mappedResult.join(""))],
  };
};

const refineResponse = async (_state: typeof StateAnnotations.State) => {
  if (DEBUG) console.log("Processing with LLM...");

  const lastToolMessage = _state.messages[
    _state.messages.length - 1
  ] as AIMessage;

  // Generate a refined prompt with explicit instructions
  const refinedPrompt = `
    Based on the following information, summarize only the deliverables related to Phase 2.
    Do not include details about Phase 3 or other unrelated content.
    ${lastToolMessage.content}
  `;
  const refinedMessage = new HumanMessage(refinedPrompt);
  // Add the refined message to the state
  _state.messages.push(refinedMessage);
  const response = await model.invoke(_state.messages);

  if (DEBUG) console.log("Refined LLM Response:", response.content);

  return {
    messages: [response],
  };
};

const model = new ChatOpenAI({
  model: MODEL_NAME,
  temperature: MODEL_TEMP,
});

//define the graph
const workflow = new StateGraph(StateAnnotations)
  .addNode("__pinecone__", pineConeTool)
  .addNode("__refine__", refineResponse)
  .addEdge(START, "__pinecone__")
  .addEdge("__pinecone__", "__refine__")
  .addEdge("__pinecone__", END);

const checkpointer = new MemorySaver();
const app = workflow.compile({ checkpointer });

async function run() {
  const payload = {
    messages: [],
    prompt: "give me data about phase 2 deliverables do not include phase 3",
    nameSpace: "emi_pdf",
    indexName: "emi-pc-example-index",
  };

  const finalState = await app.invoke(payload, {
    configurable: { thread_id: "emi-77" },
  });

  console.log(finalState.messages[finalState.messages.length - 1].content);
}

run();
