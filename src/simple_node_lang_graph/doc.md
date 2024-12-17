# LangGrpah State workflow

## Imports

```typescript
import { START, END, StateGraph, Annotation } from "@langchain/langgraph/web";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
```

- StateGraph: this is used to define a stateful workflow, where nodes represent tasks (functions) and edges define the flow between them
- START, END: Special parameters to mark the entry and exit points of the workflow
- Annotation: Used to define and annotate the schema
- BaseMessage: Generic message from the langchain
- HumanMessage: Human message in the langChain

## Defining the state with annotations

```typescript
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});
```

- Annotation.Root: defines the root structure of the workflow state
- messages: A state variable initialised as an array of BaseMessage objects
- reduces: This is a function that appends new messages (y) to the existsing (x) in the state. This is crucial for accumulating messages as the workflows progresses

## Defining a Node function in the graph

```typescript
const nodeFn = async (_state: typeof GraphState.State) => {
  return { messages: [new HumanMessage("hello from emi")] };
};
```

- nodeFn: this is the node function that rapresents a task in the graph
- it recieves the (\_state) as input and returns an updated state with a new HumanMessage

## Bulding the Workflow graph

```typescript
const workflow = new StateGraph(GraphState)
  .addNode("node", nodeFn)
  .addEdge(START, "node")
  .addEdge("node", END);
```

- new StateGraph(GraphState): Initializes a new stateful workflow with the defined GraphState.
- addNode("node", nodeFn): Adds a node named "node" to the graph, linked to the nodeFn function.
- addEdge(START, "node"): Connects the START point to the "node" node, making it the entry point of the workflow.
- addEdge("node", END): Connects the "node" node to the END, making it the exit point of the workflow.

## Compiling and Running the Workflow

```typescript
const app = workflow.compile();
```

```typescript
const fState = async () => {
  const finalState = await app.invoke({
    messages: [],
  });

  console.log(finalState.messages[finalState.messages.length - 1].content);
};
```

- workflow.compile(): Compiles the state graph into an executable runnable workflow.
- app.invoke({ messages: [] }):
- This initializes the workflow with an empty messages array.
- The workflow executes the nodes and applies the reducers to update the state.
- console.log: Outputs the last message added to the state ("hello from emi").

```typescript
fState();
```

## Theory Behind the Code

This code demonstrates stateful workflows where a state (like messages) evolves as it passes through various nodes in the workflow graph.

## Key Concepts:

1. State Management:
   • The state, defined using Annotation.Root, accumulates messages via a reducer function.
   • Reducers ensure the state remains consistent as nodes add or modify data.

2. Nodes and Edges:
   • Nodes: Functions that operate on the current state and return an updated state.
   • Edges: Define the flow of execution between nodes.

3. START and END:
   • START: The entry point where the workflow begins execution.
   • END: Marks the completion of the workflow.

4. Composable State:
   • The state (messages) is passed between nodes, and each node contributes to updating it.
   • This allows workflows to evolve dynamically and retain context across nodes.

5. Reducing State:
   • The reducer function in Annotation accumulates changes made by nodes, ensuring the state grows incrementally without being overwritten.

6. Practical Use Case:
   • In a real-world scenario, such workflows can:
   • Accumulate messages in a chatbot.
   • Process data in a pipeline.
   • Coordinate tasks where intermediate states are important.
