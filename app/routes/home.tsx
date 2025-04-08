import { useContext, useEffect, useState, type KeyboardEvent } from "react";
import type { Route } from "./+types/home";
import "./home.less"
import ChatItem from "~/components/ChatItem";
import ChatInput from "~/components/ChatInput";
import ModelSelector from "~/components/ModelSelector";
import TopDock from "~/components/TopDock";
import Content from "~/components/Content";
import { OllamaServerContext } from "~/OllamaServerContext";
import { Model, OllamaModel } from "~/models";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Chat" },
    { name: "description", content: "Chat with several LLM's" },
  ];
}

export default function Home() {

  const [history, setHistory] = useState<OllamaHistoryItem[]>([
    { role: "system", content: "You are a personal assistant", errored: false }
  ])
  const [model, setModel] = useState<Model>(new OllamaModel("",""))
  const [modelIsWriting, setModelIsWriting] = useState(false)

  const [showConfig, setShowConfig] = useState<boolean>(false)
  useEffect(() => {
    if (!window.localStorage.getItem("first-time")) {
      setShowConfig(true)
    }
  }, [])

  async function SendHandler(values: { text: string, attachments: { rawUrl: string, url: string }[] }) {
    if (modelIsWriting) return false;
    setModelIsWriting(true)
    window.scrollTo({ top: 800000000, behavior: "smooth" })

    let userIsScrolling = false
    let userIsScrollingTimeout: NodeJS.Timeout = setTimeout(() => null, 1000)
    const scrollListener = () => {
      userIsScrolling = true;
      clearTimeout(userIsScrollingTimeout)
      userIsScrollingTimeout = setTimeout(() => userIsScrolling = false, 1000)
    }
    window.addEventListener("scroll", scrollListener)

    let mock = [...history]
    mock.push({
      role: "user",
      content: values.text,
      images: values.attachments.map(f => f.url),
      __extra: { rawImages: values.attachments.map(f => f.rawUrl) },
      errored: false
    }, {
      role: "assistant",
      content: "",
      errored: false
    })

    setHistory(mock)

    try {
      model.chat(mock, (f) => {
        const scrollOnBottom = window.scrollY + window.innerHeight >= document.body.clientHeight - 300

        if (scrollOnBottom && !userIsScrolling) {
          window.scrollTo({ top: 800000000, behavior: "smooth" })
        }
        console.log(f)
        setHistory(f as any)
      })

      setModelIsWriting(false)
      window.removeEventListener("scroll", scrollListener)
      return true
    }
    catch (error) {
      console.error(error)
      mock[mock.length - 1].errored = true
      mock = [...mock]
      setHistory(mock)
      setModelIsWriting(false)
      window.removeEventListener("scroll", scrollListener)
      return false
    }
  }

  const { setOllamaAddress, setOllamaPort } = useContext(OllamaServerContext)

  return <>

    <main className="openedD">
      <TopDock>
        <ModelSelector onChange={setModel} onLoad={setModel}></ModelSelector>
        <button className="settings" onClick={() => setShowConfig(!showConfig)}>
          <span className="material-symbols-outlined">
            settings
          </span>
        </button>
      </TopDock>
      <header className="b-dock">
        <ChatInput onSubmit={SendHandler}></ChatInput>
      </header>
      <nav className="chat-list">
        <div className="inner"></div>
      </nav>
      <Content>
        <div className="chat">
          {
            history.slice(1).map((message, id) => {
              const writing = (id == history.length - 2) && modelIsWriting
              return <ChatItem key={id} message={message} isWriting={writing} />
            })
          }
        </div>
      </Content>
    </main>
    {
      <div className={`configurator ${showConfig ? "" : "hidden"}`} >
        <form onSubmit={(e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          const address = data.get("address")
          const port = data.get("port")

          if (!port || !address) return alert('BAD PORT OR ADDRESS')

          setOllamaPort(port.toString())
          setOllamaAddress(address.toString())
          setShowConfig(false)
          window.localStorage.setItem("first-time", "false")
          window.location.reload()
        }}>
          <h2>Configuration</h2>
          <p>You will want point this to your OLLAMA API.</p>
          <div className="address">
            <div>
              <label htmlFor="address">Address</label>
              <input required name="address" placeholder="Eg. 192.168.0.25" type="text" defaultValue={window.localStorage.getItem("ollama-address") ?? undefined} ></input>
            </div>
            <div>
              <label htmlFor="port">Port</label>
              <input required name='port' placeholder="Eg. 11434" min={1} max={2 ** 16} type="number" defaultValue={window.localStorage.getItem("ollama-port") ?? undefined} ></input>
            </div>
          </div>
          <button type="submit">Finish</button>
        </form>
      </div>
    }
  </>
}
