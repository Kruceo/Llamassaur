import { useContext, useEffect, useState } from "react";
import "./ModelSelector.less";
import { Link } from "react-router";
import {OllamaServerContext} from "./OllamaServerContext";

export default function (props: { onChange?: (model: string) => void, onLoad?: (model: string) => void }) {
    const { ollamaURL } = useContext(OllamaServerContext)
    const [availableModels, setAvailableModels] = useState<string[]>([])
    const [model, setModel] = useState("")
    const [hidden, setHidden] = useState(true)
    useEffect(() => {
        (async () => {
            const res = await fetch(`${ollamaURL}/api/tags`)
            const data = await res.json() as { models: { name: string, model: string }[] }
            setAvailableModels(data.models.map(m => m.model))
        })()
        const loadedModelStr = window.localStorage.getItem("prefer-model")
        if (loadedModelStr) {
            props.onLoad?.call({}, loadedModelStr) //(loadedModelStr)
            setModel(loadedModelStr)
        }
    }, [])
    useEffect(() => {
        window.localStorage.setItem("prefer-model", model)
    }, [model])

    const [modelName, modelTag] = model.split(":")

    return <button id="model-selector" onClick={() => setHidden(!hidden)}>
        {formatModelName(modelName)}<span className="selected-model-tag">{modelTag}</span>
        <div className={`list-frame ${hidden ? "hidden" : ""}`}>
            <div className={`list`}>
                {availableModels.map(modelName => <button key={modelName} onClick={() => { setModel(modelName); props.onChange?.call({}, modelName) }}>{formatModelName(modelName)}</button>)}
            </div>
            <div className="fixed-container">
                <Link to={"/moremodels"} className="more-models">More Models</Link>
            </div>
        </div>
    </button>
}

function formatModelName(str: string) {
    return str.replace(/_|-/g, " ").replace(/^.*?\//, "")
}