import { useContext, useEffect, useState } from "react"
import "./moreModels.less";
import TopDock from "~/TopDock";
import Content from "~/Content";
import { Link } from "react-router";
import ChatInput from "~/ChatInput";
import { OllamaServerContext } from "~/OllamaServerContext";
export default function () {
    const {ollamaURL} = useContext(OllamaServerContext)
    interface ModelButtonData {
        name: string,
        tag: string,
        desc: string
        // rawName: string,
        pullData?: OllamaPullResponseChunk

    }
    // const [alreadyPurchasedModels, setAlreadyPurchasedModels] = useState<string[]>([])
    const [availableModels, setAvailableModels] = useState<Record<string, ModelButtonData>>({
        "llama3.2-vision:11b":{name:"LLama 3.2 Vision",tag:"11B",desc:"Llama 3.2 Vision is a collection of instruction-tuned image reasoning generative models in 11B and 90B sizes."},
        "deepseek-r1:7b": { name: "DeepSeek R1", tag: "7B", desc: "DeepSeek's first-generation of reasoning models with comparable performance to OpenAI-o1, including six dense models distilled from DeepSeek-R1 based on Llama and Qwen." },
        "deepseek-v2:16b": { name: "DeepSeek V2", tag: "16B", desc: "A strong, economical, and efficient Mixture-of-Experts language model." },
        "sailor2:20b": { name: "Sailor 2", tag: "20B", desc: "Sailor2 are multilingual language models made for South-East Asia. Available in 1B, 8B, and 20B parameter sizes." },
        "vicuna:7b":{name:"Vicuna",tag:"7B",desc:"General use chat model based on Llama and Llama 2 with 2K to 16K context sizes."},
        "phi4:14b": { name: "Phi 4", tag: "14B", desc: "Phi-4 is a 14B parameter, state-of-the-art open model from Microsoft." },
        "llava-phi3:3.8b": { name: "LLava Phi 3", tag: "3.8B", desc: "A new small LLaVA model fine-tuned from Phi 3 Mini." },
        "llava-llama3:8b": { name: "LLava LLama3", tag: "8B", desc: "A LLaVA model fine-tuned from Llama 3 Instruct with better scores in several benchmarks." }
    })

    useEffect(() => {
        (async () => {
            const res = await fetch(`${ollamaURL}/api/tags`)
            const data = (await res.json() as { models: { name: string, model: string }[] }).models.map(e => e.model)
            // setAlreadyPurchasedModels(data.models.map(m => m.model))
            const mock = { ...availableModels }
            console.log(data)
            for (const key in mock) {
                if (data.includes(key)) mock[key].pullData = { status: "Already Installed" }
            }
            setAvailableModels(mock)
        })()
    }, [])

    async function downloadModel(model: string, callback: (chunk: OllamaPullResponseChunk) => void) {
        const res = await fetch(`${ollamaURL}/api/pull`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "model": model
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

            const chunkObj = JSON.parse(chunk) as OllamaPullResponseChunk[]

            for (const item of chunkObj) {
                callback(item)
            }

            if (done) break;
        }
    }

    const [currentCustomChunk, setCurrentCustomChunk] = useState<OllamaPullResponseChunk>()

    return <main>
        <TopDock>
            <Link to="/">Chat</Link>
        </TopDock>
        <Content>
            <h2>Download Custom Model</h2>
            <div className="custom-model-input-container">
                <ChatInput disableAnimations disableAttachments placeholder="Type model name here!" onSubmit={async (t) => { await downloadModel(t.text, (c) => { setCurrentCustomChunk(c) }); return true }}></ChatInput>
                {
                    currentCustomChunk ? <div className="custom-chunk-data">{currentCustomChunk.status}</div> : null
                }
            </div>
            <h2>Default Models</h2>
            <div className="list">
                {
                    Object.keys(availableModels).map(modelKey => {
                        const model = availableModels[modelKey]
                        return <button key={modelKey} onClick={async () => {
                            if (model.pullData?.status == "Already Installed" || /Success|Pulling/.test(model.pullData?.status ?? "")) return
                            await downloadModel(modelKey, (chunk) => {
                                const mock = { ...availableModels }
                                mock[modelKey].pullData = chunk
                                setAvailableModels(mock)
                            })
                        }}>
                            <div className="main">
                                <span className="name">{model.name}</span> <span className="tag">{model.tag}</span>
                                {!model.pullData ? null :
                                    <>
                                        {
                                            <span className="status">{model.pullData.status}</span>
                                        }
                                        {
                                            !model.pullData.completed || !model.pullData.total ? null :
                                                <span className="stage">{(model.pullData.completed / 1000 / 1000 ).toFixed(0)} / {(model.pullData.total / 1000 / 1000).toFixed(0)} MB</span>
                                        }
                                    </>
                                }
                            </div>
                            <p className="desc">{model.desc}</p>
                        </button>
                    })

                }</div>
        </Content>
    </main>
}