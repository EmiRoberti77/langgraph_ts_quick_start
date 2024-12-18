import { START, END, StateGraph, Annotation } from "@langchain/langgraph";
import { gatherIterator } from "@langchain/langgraph/dist/utils";

//define Root State
const StateAnnotations = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

//Define Nodes
const weatherNode = async (__state: typeof StateAnnotations.State) => {
  console.log(__state.aggregate);
  const data = await fetch(
    "https://meteostat.p.rapidapi.com/point/monthly?lat=52.5244&lon=13.4105&alt=43&start=2020-01-01&end=2020-12-31",
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "4e7466d34amsha9f724564a9cf92p13c88ejsn35eca6b36f4b",
      },
    }
  );
  console.log(await data.json());
  return {
    aggregate: ["Weather report"],
  };
};

//build graph
const graphBuilder = new StateGraph(StateAnnotations)
  .addNode("weather", weatherNode)
  .addEdge(START, "weather")
  .addEdge("weather", END);

const graph = graphBuilder.compile();

//run the graph
const invokeGraph = async () => {
  const finalState = await graph.invoke({
    aggregate: [],
  });

  console.log(finalState);
};

invokeGraph();
