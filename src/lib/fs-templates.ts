export function buildTemplates() {
  const requirementsTxt = ["annotated-types==0.7.0", "anyio==4.11.0", "blockbuster==1.5.25", "certifi==2025.8.3", "cffi==2.0.0", "charset-normalizer==3.4.3", "click==8.3.0", "cloudpickle==3.1.1", "cryptography==44.0.3", "distro==1.9.0", "forbiddenfruit==0.1.4", "grpcio==1.75.1", "grpcio-tools==1.75.1", "h11==0.16.0", "httpcore==1.0.9", "httpx==0.28.1", "idna==3.10", "jiter==0.11.0", "jsonpatch==1.33", "jsonpointer==3.0.0", "jsonschema_rs==0.29.1", "langchain==0.3.27", "langchain-core==0.3.76", "langchain-openai==0.3.33", "langchain-text-splitters==0.3.11", "langgraph==0.6.7", "langgraph-api==0.4.29", "langgraph-checkpoint==2.1.1", "langgraph-cli==0.4.2", "langgraph-prebuilt==0.6.4", "langgraph-runtime-inmem==0.14.1", "langgraph-sdk==0.2.9", "langsmith==0.4.31", "openai==1.109.1", "orjson==3.11.3", "ormsgpack==1.10.0", "packaging==25.0", "protobuf==6.32.1", "pycparser==2.23", "pydantic==2.11.9", "pydantic_core==2.33.2", "PyJWT==2.10.1", "python-dotenv==1.1.1", "PyYAML==6.0.3", "regex==2025.9.18", "requests==2.32.5", "requests-toolbelt==1.0.0", "setuptools==80.9.0", "sniffio==1.3.1", "SQLAlchemy==2.0.43", "sse-starlette==2.1.3", "starlette==0.48.0", "structlog==25.4.0", "tenacity==9.1.2", "tiktoken==0.11.0", "tqdm==4.67.1", "truststore==0.10.4", "typing-inspection==0.4.1", "typing_extensions==4.15.0", "urllib3==2.5.0", "uvicorn==0.37.0", "watchfiles==1.1.0", "xxhash==3.5.0", "zstandard==0.25.0"].join("\n");

  const envFile = `# copy your key(s) here
OPENAI_API_KEY=
`;

  const configJson = JSON.stringify(
    {
      dependencies: [
        "langchain_openai",
        "./my_agent"
      ],
      graphs: {
        "my_agent": "./my_agent/agent.py:build_graph"
      },
      env: "./.env"
    },
    null,
    2
  );

  const pkgInit = `# my_agent package`;

  const utilsInit = `# my_agent.utils`;

  const statePy = `from typing import TypedDict, List
from langchain_core.messages import BaseMessage

class State(TypedDict, total=False):
    input: str
    messages: List[BaseMessage]
    result: str
`;

  const toolsPy = `# Define optional tools here
def ping_tool(q: str) -> str:
    return f"pong: {q}"
`;

  const nodesPy = `from typing import List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from .state import State

def node_input(state: State) -> State:
    msgs: List[BaseMessage] = list(state.get("messages") or [])
    if state.get("input"):
        msgs.append(HumanMessage(content=str(state["input"])))
    return {"messages": msgs}

def node_prompt(state: State) -> State:
    msgs: List[BaseMessage] = list(state.get("messages") or [])
    if state.get("input"):
        prompt = f"You are helpful. Answer concisely.\\n\\nQ: {state['input']}"
        msgs.append(HumanMessage(content=prompt))
    return {"messages": msgs}

def node_llm(state: State, model: str = "gpt-4o-mini", temperature: float = 0.2) -> State:
    llm = ChatOpenAI(model=model, temperature=temperature)
    msgs: List[BaseMessage] = list(state.get("messages") or [])
    if not msgs and state.get("input"):
        msgs.append(HumanMessage(content=str(state["input"])))
    ai = llm.invoke(msgs)
    msgs.append(ai)
    return {"messages": msgs}

def node_output(state: State) -> State:
    msgs: List[BaseMessage] = list(state.get("messages") or [])
    content = None
    if msgs:
        last = msgs[-1]
        content = getattr(last, "content", str(last))
    return {"result": content or str(state.get("input", "")), "messages": msgs}
`;

  const agentPy = `import os
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from .utils.state import State
from .utils.nodes import node_input, node_prompt, node_llm, node_output

def build_graph(model: str = "gpt-4o-mini", temperature: float = 0.2):
    g = StateGraph(State)

    def llm_node(state: State) -> State:
        return node_llm(state, model=model, temperature=temperature)

    g.add_node("input", node_input)
    g.add_node("prompt", node_prompt)
    g.add_node("llm", llm_node)
    g.add_node("output", node_output)

    g.add_edge(START, "input")
    g.add_edge("input", "prompt")
    g.add_edge("prompt", "llm")
    g.add_edge("llm", "output")
    g.add_edge("output", END)

    return g.compile()

if __name__ == "__main__":
    load_dotenv()
    app = build_graph()
    user = input("Enter your question: ")
    out = app.invoke({"input": user, "messages": []})
    print(out.get("result") or out)
`;

  return {
    requirementsTxt,
    envFile,
    configJson,
    pkgInit,
    utilsInit,
    statePy,
    toolsPy,
    nodesPy,
    agentPy,
  };
}