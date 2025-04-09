import { useContext, useEffect, useState } from "react";
import "./ModelSelector.less";
import { Link } from "react-router";
import { OllamaServerContext } from "../OllamaServerContext";
import { CloudflareModel, defaultCloudflareModel, Model, OllamaModel } from "~/models";

export default function (props: { onChange?: (model: Model) => void, onLoad?: (model: Model) => void }) {
    const { ollamaURL } = useContext(OllamaServerContext)
    const [availableModels, setAvailableModels] = useState<Model[]>([])
    const [model, setModel] = useState<Model>(defaultCloudflareModel)
    const [hidden, setHidden] = useState(true)

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${ollamaURL}/api/tags`)
                const data = await res.json() as { models: { name: string, model: string }[] }
                const newAvailableModels: Model[] = data.models.map(m => {
                    return new OllamaModel(m.model, ollamaURL)
                })
                newAvailableModels.push(defaultCloudflareModel)
                setAvailableModels(newAvailableModels)
            } catch (error) {
                setAvailableModels([defaultCloudflareModel])
            }

        })()

        const loadedModelStr = window.localStorage.getItem("prefer-model")
        const loadedModelType = window.localStorage.getItem("prefer-model-type") ?? "ollama"

        // load model stored in browser local-storage
        if (loadedModelStr) {
            if (loadedModelType == "ollama") {
                const m = new OllamaModel(loadedModelStr, ollamaURL)
                setModel(m)
                props.onLoad?.call({}, m)
            } else if (loadedModelType == "cloudflare-default") {
                const m = defaultCloudflareModel
                setModel(m)
                props.onLoad?.call({}, m)
            }
        }
    }, [])
    useEffect(() => {
        if (!model) return
        window.localStorage.setItem("prefer-model", model.name)
        window.localStorage.setItem("prefer-model-type", model.type)
    }, [model])

    const [modelName, modelTag] = (model?.name ?? "No name:No Tag").split(":")

    return <div tabIndex={0} id="model-selector"  >
        <button className="selected" onFocus={() => setHidden(false)} onBlur={() => setHidden(true)}>
            <span className="model-name">{formatModelName(modelName)}</span><span className="selected-model-tag">{modelTag}</span>
        </button>
        <div className={`list-frame ${hidden ? "hidden" : ""}`}>
            <div className={`list`}>
                {availableModels.map(model => <button key={model.name + model.type} onClick={() => { setModel(model); props.onChange?.call({}, model) }}>
                    <ListModelName raw={model.name} />
                </button>)}
            </div>
            <div className="fixed-container">
                <Link to={"/moremodels"} className="more-models">More Models</Link>
            </div>
        </div>
    </div>
}

function formatModelName(str: string) {
    return str.replace(/_|-/g, " ").replace(/^.*?\//, "")
}

function ListModelName(props: { raw: string }) {
    const [name, tag] = formatModelName(props.raw).split(":")
    return <>
        <span className="list-model-name">{name}</span>
        <span className="list-model-tag">{tag}</span>
    </>
}