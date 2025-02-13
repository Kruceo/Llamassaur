import { useEffect, useState } from "react"
import "./moreModels.less";
import { proto, address, port } from "~/backend";
export default function () {
    interface ModelButtonData {
        name: string,
        tag: string,
        // rawName: string,
        pullData?: OllamaPullResponseChunk

    }
    // const [alreadyPurchasedModels, setAlreadyPurchasedModels] = useState<string[]>([])
    const [availableModels, setAvailableModels] = useState<Record<string, ModelButtonData>>({
        "deepseek-r1:1.5b": { name: "DeepSeek R1", tag: "1.5B" },
        "deepseek-r1:7b": { name: "DeepSeek R1", tag: "7B" },
        "deepseek-r1:14b": { name: "DeepSeek R1", tag: "14B" },
        "sailor2:20b": { name: "Sailor 2", tag: "20B" },
        "phi4:latest": { name: "Phi 4", tag: "13B" },
        "phuzzy/minecraft:latest": { name: "Phuzzy Minecraft", tag: "1B" },
        "llama3.2-vision:11b": { name: "LLama3.2 Vision", tag: "11B" },
        "llava:13b": { name: "LLava", tag: "13B" },
        "llava-phi3:3.8b": { name: "LLava Phi 3", tag: "3.8B" }
    })

    useEffect(() => {
        (async () => {
            const res = await fetch(`${proto}://${address}:${port}/api/tags`)
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

    return <main>
        <div className="list">
            {
                Object.keys(availableModels).map(modelKey => {
                    const model = availableModels[modelKey]
                    return <button key={modelKey} onClick={async () => {
                        if (model.pullData?.status == "Already Installed" || /Success|Pulling/.test(model.pullData?.status ?? "")) return
                        const res = await fetch(`${proto}://${address}:${port}/api/pull`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                "model": modelKey
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
                                console.log(item)
                                const mock = { ...availableModels }
                                mock[modelKey].pullData = item
                                setAvailableModels(mock)
                            }

                            if (done) break;
                        }


                    }}>
                        {model.name} <span className="tag">{model.tag}</span>
                        {!model.pullData ? null :
                            <>
                                {
                                    <span className="status">{model.pullData.status}</span>
                                }
                                {
                                    !model.pullData.completed || !model.pullData.total ? null :
                                        <span className="stage">{(model.pullData.total / 1000 / 1000 / 1000).toFixed(2)} / {(model.pullData.completed / 1000 / 1000 / 1000).toFixed(2)} GB</span>
                                }
                            </>
                        }
                    </button>
                })

            }</div>
    </main>
}