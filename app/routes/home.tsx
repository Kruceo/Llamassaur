import { useContext, useEffect, useState, type KeyboardEvent } from "react";
import type { Route } from "./+types/home";
import "./home.less"
import ChatItem from "~/ChatItem";
import ChatInput from "~/ChatInput";
import ModelSelector from "~/ModelSelector";
import TopDock from "~/TopDock";
import Content from "~/Content";
import { OllamaServerContext } from "~/OllamaServerContext";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Kruceo - Chat" },
    { name: "description", content: "Chat with several LLM's" },
  ];
}

export default function Home() {
  
  const { ollamaURL } = useContext(OllamaServerContext)

  const [history, setHistory] = useState<OllamaHistoryItem[]>([
    { role: "assistant", content: "Hello, I'm your personal assistant!", errored: false },
    // { role: "user", content: "Use this format '{color}' as prefix to tag words which you want fill, use hex format to choose the color, words like corporation names or places, use colors from this corporations or places", errored: false }
  ])
  const [model, setModel] = useState("deepseek-r1:1.5b")
  const [modelIsWriting, setModelIsWriting] = useState(false)
  useEffect(() => {
    const inter = setInterval(() => {
      // console.log(window.scrollY + window.innerHeight, document.body.clientHeight - 400)
    }, 1000 / 30);
    return () => clearInterval(inter)
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



  return <>
    <main className="openedD">
      <TopDock>
        <ModelSelector onChange={setModel} onLoad={setModel}></ModelSelector>
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
  </>
}
