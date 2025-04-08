import { useContext, useEffect, useState } from "react"
import "./moreModels.less";
import TopDock from "~/components/TopDock";
import Content from "~/components/Content";
import { Link } from "react-router";
import ChatInput from "~/components/ChatInput";
import { OllamaServerContext } from "~/OllamaServerContext";
import ModelCard from "~/components/ModelCard";
import type { Route } from "../+types/root";
import { defaultCloudflareModel, Model, OllamaModel } from "~/models";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Models" },
        { name: "description", content: "Manage your models" },
    ];
}


export default function () {
    const { ollamaURL } = useContext(OllamaServerContext)
    interface ModelButtonData {
        name: string,
        tag: string,
        desc?: string,
        vision?: boolean
        pullData?: OllamaPullResponseChunk
    }

    const newRecommendations = {
        "gemma3:12b": {
            preStatus: "",
            desc: "The current, most capable model that runs on a single GPU.",
            model: new OllamaModel("gemma3:12b", ollamaURL)
        },
        "llama3.1:405b":{
            preStatus: "",
            desc: "Llama 3.1 is a new state-of-the-art model from Meta available in 8B, 70B and 405B parameter sizes.",
            model: new OllamaModel("llama3.1:405b", ollamaURL)
        },
        "llama3.2-vision:11b": {
            preStatus: "",
            desc: "Llama 3.2 Vision is a collection of instruction-tuned image reasoning generative models in 11B and 90B sizes.",
            model: new OllamaModel("llama3.2-vision:11b", ollamaURL)
        },
        "deepseek-r1:7b": {
            preStatus: "",
            desc: "DeepSeek's first-generation of reasoning models with comparable performance to OpenAI-o1, including six dense models distilled from DeepSeek-R1 based on Llama and Qwen.",
            model: new OllamaModel("deepseek-r1:7b", ollamaURL)
        },
        "deepseek-v2:16b": {
            preStatus: "",
            desc: "A strong, economical, and efficient Mixture-of-Experts language model.",
            model: new OllamaModel("deepseek-v2:16b", ollamaURL)
        },
        "sailor2:20b": {
            preStatus: "",
            desc: "Sailor2 are multilingual language models made for South-East Asia. Available in 1B, 8B, and 20B parameter sizes.",
            model: new OllamaModel("sailor2:20b", ollamaURL)
        },
        "vicuna:7b": {
            preStatus: "",
            desc: "General use chat model based on Llama and Llama 2 with 2K to 16K context sizes.",
            model: new OllamaModel("vicuna:7b", ollamaURL)
        },
        "phi4:14b": {
            preStatus: "",
            desc: "Phi-4 is a 14B parameter, state-of-the-art open model from Microsoft.",
            model: new OllamaModel("phi4:14b", ollamaURL)
        },
        "llava-phi3:3.8b": {
            preStatus: "",
            desc: "A new small LLaVA model fine-tuned from Phi 3 Mini.",
            model: new OllamaModel("llava-phi3:3.8b", ollamaURL)
        },
        "llava-llama3:8b": {
            preStatus: "",
            desc: "A LLaVA model fine-tuned from Llama 3 Instruct with better scores in several benchmarks.",
            model: new OllamaModel("llava-llama3:8b", ollamaURL)
        },
        "smollm:135m": {
            preStatus: "",
            desc: "A family of small models with 135M, 360M, and 1.7B parameters, trained on a new high-quality dataset.",
            model: new OllamaModel("smollm:135m", ollamaURL)
        },
        "qwen:0.5b": {
            preStatus: "",
            desc: "Qwen 1.5 is a series of large language models by Alibaba Cloud spanning from 0.5B to 110B parameters",
            model: new OllamaModel("qwen:0.5b", ollamaURL)
        }
    }

    const [recommendations, setRecommendations] = useState<Record<string, { preStatus: string, desc: string, model: Model }>>(newRecommendations)

    const [installedModels, setInstalledModels] = useState<Record<string, { preStatus: string, desc: string, model: Model }>>({})

    useEffect(() => {
        (async () => {
            const res = await fetch(`${ollamaURL}/api/tags`)
            const data = await res.json() as { models: { name: string, model: string }[] }

            const installedMock = {} as typeof installedModels
            for (const m of data.models) {
                installedMock[m.model] = { desc: "", preStatus: "", model: new OllamaModel(m.name, ollamaURL) }
            }

            const justNames = data.models.map(e => e.model)
            const mock = { ...recommendations }
            for (const key in mock) {
                if (justNames.includes(key)) mock[key].preStatus = "Already Installed"
            }
            setInstalledModels(installedMock)
            setRecommendations(mock)
        })()
    }, [])

    const [customModelStatus, setCustomModelStatus] = useState<string>()

    return <main>
        <TopDock>
            <Link to="/">Chat</Link>
        </TopDock>
        <Content>
            <h2>Get a Custom Model</h2>
            <p>You can find a variety of models in <a target="_blank" href="https://ollama.com/library">Ollama Website</a></p>
            <br></br>
            <div className="custom-model-input-container">
                <ChatInput disableAnimations disableAttachments placeholder="Type model name here!" onSubmit={async (t) => {
                    const m = new OllamaModel(t.text,ollamaURL)
                    const lid = m.addOnStatusChangeListener(setCustomModelStatus)
                    await m.download()
                    m.removeOnStatusChangeListener(lid.toString())
                    return true
                }}/>
                {
                    customModelStatus ? <div className="custom-chunk-data">{customModelStatus}</div> : null
                }
            </div>
            <h2>Recommended</h2>
            <p>A list of well-known models</p>
            <div className="list">
                {
                    Object.keys(recommendations).map(modelKey => {
                        const model = recommendations[modelKey]
                        return <ModelCard model={model.model} desc={model.desc} key={modelKey} status={model.preStatus} />
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
                        return <ModelCard model={model.model} desc={model.desc} key={modelKey} status={model.preStatus} disableDownload installed />
                    })
                }
                <ModelCard model={defaultCloudflareModel} desc="This model is just a demo using AI workers from cloudflare." status="" disableDelete disableDownload installed/>
            </div>
            <br></br>
            <br></br>
        </Content>
    </main>
}