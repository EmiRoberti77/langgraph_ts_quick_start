import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";

dotenv.config();

//define the langchain tools and agent
const agentTools = [new TavilySearchResults({ maxResults: 3 })];
const agentModel = new ChatOpenAI({ temperature: 0.2 });

//init memory to persist state between graph runs
const agentCheckPoint = new MemorySaver();
const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools,
  checkpointSaver: agentCheckPoint,
});

async function invoke(question: string, thread_id: number) {
  const agentFinalState = await agent.invoke(
    {
      messages: [new HumanMessage(question)],
    },
    {
      configurable: {
        thread_id,
      },
    }
  );

  //console.log(agentFinalState);
  const response =
    agentFinalState.messages[agentFinalState.messages.length - 1].content;
  console.log(response);
}

invoke("who won the 2024 F1 championship?", 10);
