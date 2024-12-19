# LangGraph with LLM and Pinecone Integration

## What is LangGraph?

LangGraph is a framework that orchestrates workflows with stateful interactions between tools, annotations, and large language models (LLMs). By structuring workflows as state graphs, LangGraph makes it easier to design, debug, and execute complex interactions, such as querying databases and refining responses using LLMs.

## Why Use LangGraph with LLMs?

- Structured Workflows: Without LangGraph, combining multiple tools and LLMs often involves hard-to-manage code with ad hoc state handling.
- LangGraph provides a structured approach using nodes (tools or functions) and edges (dependencies).

## State Management:

- Tracks the flow of data using annotations, ensuring smooth transitions between nodes.
- Avoids repetitive boilerplate code by automating state transitions.

## LLM Integration:

- Enables seamless chaining of LLMs with tools like Pinecone for vector database querying.
- Allows post-processing and response refinement to produce user-specific outputs.

## Reusability:

- Modular nodes and reusable workflows make LangGraph ideal for scalable applications.

## How This Code Works

1. Problem Statement
   This application queries a Pinecone vector database to retrieve relevant information (e.g., "Phase 5 deliverables")
   and refines the results using an LLM. The user specifies what to query, and the program:

- Fetches data from Pinecone.
- Summarizes and filters the results using an LLM.

2. Workflow Overview
   The workflow is implemented using a StateGraph, which manages the interactions between the following components:

- Nodes:

  - pineConeTool: Queries Pinecone for relevant results.
  - refineResponse: Processes and summarizes the results using an LLM.

- Edges:

  - Define the order of execution:
  - Start → Query Pinecone → Refine Response → End.

- Annotations:
  - prompt: The user's query.
  - nameSpace: Namespace in the Pinecone index.
  - indexName: Pinecone index to query.
  - messages: Tracks tool outputs and LLM refinements.

1. Code Workflow

   1. User Query:

   - The user specifies the prompt, nameSpace, and indexName.
   - Example: "give me data about phase 5 deliverables do not include phase 6 of the project".

   1. Pinecone Query (pineConeTool):

      - Uses embeddings to query Pinecone for relevant results.
      - Filters results and returns the matches.
      - LLM Refinement (refineResponse):

   2. Passes the raw results to the LLM.

      - Instructs the LLM to summarize and filter the results (e.g., exclude Phase 3).

   3. Final Output:
      - Returns a refined and concise response to the user.

## Key Components ( tools )

1. Pinecone Tool
   this tool:

   Embeds the user query using OpenAI embeddings.
   Queries Pinecone for the top 3 matching results.
   Outputs raw matches for further processing.

1. Refine Response Tool
   This tool:

   Summarises the results from Pinecone using an LLM.
   Filters and restructures the output based on user constraints.

```typescript
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
    prompt: "give me data about phase 5 deliverables do not include phase 6",
    nameSpace: "emi_pdf",
    indexName: "emi-pc-example-index",
  };

  const finalState = await app.invoke(payload, {
    configurable: { thread_id: "emi-77" },
  });

  console.log(finalState.messages[finalState.messages.length - 1].content);
}

run();
```
