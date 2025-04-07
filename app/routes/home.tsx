import { useContext, useEffect, useState, type KeyboardEvent } from "react";
import type { Route } from "./+types/home";
import "./home.less"
import ChatItem from "~/components/ChatItem";
import ChatInput from "~/components/ChatInput";
import ModelSelector from "~/components/ModelSelector";
import TopDock from "~/components/TopDock";
import Content from "~/components/Content";
import { OllamaServerContext } from "~/OllamaServerContext";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Chat" },
    { name: "description", content: "Chat with several LLM's" },
  ];
}

export default function Home() {

  const { ollamaURL } = useContext(OllamaServerContext)
  const [history, setHistory] = useState<OllamaHistoryItem[]>([
    { role: "assistant", content: "Hello, I'm your personal assistant!", errored: false },
    // { role: "user", content: "Use this format '{color}' as prefix to tag words which you want fill, use hex format to choose the color, words like corporation names or places, use colors from this corporations or places", errored: false },
    // { role: "assistant", content: test, errored: false }
  ])
  const [model, setModel] = useState("deepseek-r1:1.5b")
  const [modelIsWriting, setModelIsWriting] = useState(false)
  useEffect(() => {
    const inter = setInterval(() => {
      // console.log(window.scrollY + window.innerHeight, document.body.clientHeight - 400)
    }, 1000 / 30);
    return () => clearInterval(inter)
  }, [])

  const [showConfig, setShowConfig] = useState<boolean>(false)
  useEffect(() => {
    if (!window.localStorage.getItem("first-time")) {
      setShowConfig(true)
    }
  }, [])

  async function Send(values: { text: string, attachments: { rawUrl: string, url: string }[] }) {
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
      __extra: { rawImages: values.attachments.map(f => f.rawUrl) },//.map(e => e.replace(/^data:image\/.+?;base64,/, "")),
      errored: false
    }, {
      role: "assistant",
      content: "",
      errored: false
    })
    console.log(mock)
    setHistory(mock)

    try {
      const res = await fetch(`${ollamaURL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          messages: [...mock].map(f => { f.images = f.images?.map(i => i.replace(/^data:image\/.+?;base64,/, "")); return f })
        })
      })
      const reader = res.body?.getReader();
      if (!reader) {
        console.warn("No reader!");
        return false
      }
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        let chunk = "[" + decoder.decode(value, { stream: true }).replace(/\n/g, ",")
        if (chunk.endsWith(",")) chunk = chunk.slice(0, chunk.length - 1)
        chunk += "]"
        console.log(chunk)
        if (!mock[mock.length - 1].content) mock[mock.length - 1].content = ""
        mock[mock.length - 1].content += JSON.parse(chunk).reduce((ac: string, next: OllamaChatResponseChunk) => next.error ? (ac + next.error) : (ac + next.message?.content), "")
        mock = [...mock]
        console.log(mock)
        const scrollOnBottom = window.scrollY + window.innerHeight >= document.body.clientHeight - 300
        setHistory(mock)

        if (scrollOnBottom && !userIsScrolling) {
          window.scrollTo({ top: 800000000, behavior: "smooth" })
        }

        if (done) break;
      }

      setModelIsWriting(false)
      window.removeEventListener("scroll", scrollListener)
      return true
    }
    catch (error) {
      console.error(error)
      mock[mock.length - 1].errored = true
      // mock[mock.length - 1].content = "" + error
      mock = [...mock]
      setHistory(mock)
      setModelIsWriting(false)
      window.removeEventListener("scroll", scrollListener)
      return false
    }
  }

  const { setOllamaAddress, setOllamaPort, setOllamaProto, ollamaPort } = useContext(OllamaServerContext)

  return <>

    <main className="openedD">
      <TopDock>
        <ModelSelector onChange={setModel} onLoad={setModel}></ModelSelector>
        <button className="settings" onClick={()=>setShowConfig(!showConfig)}>
          <span className="material-symbols-outlined">
            settings
          </span>
        </button>
      </TopDock>
      <header className="b-dock">
        <ChatInput onSubmit={Send}></ChatInput>
      </header>
      <nav className="chat-list">
        <div className="inner"></div>
      </nav>
      <Content>
        <div className="chat">
          {/* <ChatItem message={{ content: ``, role: "assistant", errored: false }}></ChatItem> */}
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
        <div className={`configurator ${showConfig?"":"hidden"}`} >
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
                <input required name="address" placeholder="Eg. 192.168.0.25" type="text" defaultValue={window.localStorage.getItem("ollama-address")??undefined} ></input>
              </div>
              <div>
                <label htmlFor="port">Port</label>
                <input required name='port' placeholder="Eg. 11434" min={1} max={2 ** 16} type="number" defaultValue={window.localStorage.getItem("ollama-port")??undefined} ></input>
              </div>
            </div>
            <button type="submit">Finish</button>
          </form>
        </div>
    }
  </>
}
