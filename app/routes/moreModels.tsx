import { useContext, useEffect, useState } from "react"
import "./moreModels.less";
import TopDock from "~/components/TopDock";
import Content from "~/components/Content";
import { Link } from "react-router";
import ChatInput from "~/components/ChatInput";
import { OllamaServerContext } from "~/OllamaServerContext";
import ModelCard from "~/components/ModelCard";
import type { Route } from "../+types/root";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Models" },
    { name: "description", content: "Manage your models" },
  ];
}


export default function () {
    const { ollamaURL,downloadModel } = useContext(OllamaServerContext)
    interface ModelButtonData {
        name: string,
        tag: string,
        desc?: string,
        vision?: boolean
        pullData?: OllamaPullResponseChunk
    }

    const [recommendations, setRecommendations] = useState<Record<string, ModelButtonData>>({
        "llama3.2-vision:11b": { name: "LLama 3.2 Vision", vision: true, tag: "11B", desc: "Llama 3.2 Vision is a collection of instruction-tuned image reasoning generative models in 11B and 90B sizes." },
        "deepseek-r1:7b": { name: "DeepSeek R1", tag: "7B", desc: "DeepSeek's first-generation of reasoning models with comparable performance to OpenAI-o1, including six dense models distilled from DeepSeek-R1 based on Llama and Qwen." },
        "deepseek-v2:16b": { name: "DeepSeek V2", tag: "16B", desc: "A strong, economical, and efficient Mixture-of-Experts language model." },
        "sailor2:20b": { name: "Sailor 2", tag: "20B", desc: "Sailor2 are multilingual language models made for South-East Asia. Available in 1B, 8B, and 20B parameter sizes." },
        "vicuna:7b": { name: "Vicuna", tag: "7B", desc: "General use chat model based on Llama and Llama 2 with 2K to 16K context sizes." },
        "phi4:14b": { name: "Phi 4", vision: true, tag: "14B", desc: "Phi-4 is a 14B parameter, state-of-the-art open model from Microsoft." },
        "llava-phi3:3.8b": { name: "LLava Phi 3", tag: "3.8B", desc: "A new small LLaVA model fine-tuned from Phi 3 Mini." },
        "llava-llama3:8b": { name: "LLava LLama3", tag: "8B", desc: "A LLaVA model fine-tuned from Llama 3 Instruct with better scores in several benchmarks." }
    })

    const [installedModels, setInstalledModels] = useState<Record<string, ModelButtonData>>({})

    useEffect(() => {
        (async () => {
            const res = await fetch(`${ollamaURL}/api/tags`)
            const data = await res.json() as { models: { name: string, model: string }[] }

            const installedMock = {} as typeof installedModels
            for (const m of data.models) {
                const [name, tag] = m.name.split(":")
                installedMock[m.model] = { name, tag, desc: "" }
            }

            const justNames = data.models.map(e => e.model)
            const mock = { ...recommendations }
            for (const key in mock) {
                if (justNames.includes(key)) mock[key].pullData = { status: "Already Installed" }
            }
            setInstalledModels(installedMock)
            setRecommendations(mock)
        })()
    }, [])

    const [currentCustomChunk, setCurrentCustomChunk] = useState<OllamaPullResponseChunk>()

    return <main>
        <TopDock>
            <Link to="/">Chat</Link>
        </TopDock>
        <Content>
            <h2>Get a Custom Model</h2>
            <p>You can find a variety of models in <a href="https://ollama.com/library">Ollama Website</a></p>
            <br></br>
            <div className="custom-model-input-container">
                <ChatInput disableAnimations disableAttachments placeholder="Type model name here!" onSubmit={async (t) => { await downloadModel(t.text, (c) => { setCurrentCustomChunk(c) }); return true }}></ChatInput>
                {
                    currentCustomChunk ? <div className="custom-chunk-data">{currentCustomChunk.status}</div> : null
                }
            </div>
            <h2>Recommended</h2>
            <p>A list of well-known models</p>
            <div className="list">

                {
                    Object.keys(recommendations).map(modelKey => {
                        const model = recommendations[modelKey]
                        return <ModelCard rawString={modelKey} tag={model.tag} name={model.name} desc={model.desc} key={modelKey} vision={model.vision} pullData={model.pullData} />
                    })

                }
            </div>

            <h2>Your Models</h2>
            <p>Models that you already have in your machine</p>
            <br></br>
            <div className="list">
                {
                    Object.keys(installedModels).map(modelKey => {
                        const model = installedModels[modelKey]
                        return <ModelCard vision={model.vision} rawString={modelKey} tag={model.tag} name={model.name} desc={model.desc} key={modelKey} pullData={model.pullData} disableDownload installed />
                    })
                }
            </div>
            <br></br>
            <br></br>
        </Content>
    </main>
}