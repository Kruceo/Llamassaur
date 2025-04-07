import { useContext, useEffect, useState } from "react"
import { OllamaServerContext } from "../OllamaServerContext"
import "./ModelCard.less"
export default function (props: { pullData?: OllamaPullResponseChunk, rawString: string, vision?: boolean, name: string, desc?: string, tag: string, installed?: boolean, disableDownload?: boolean }) {
    const { name, desc, tag, rawString, vision } = props
    
    const [pullData, setPullData] = useState(props.pullData)
    useEffect(() => { setPullData(props.pullData) }, [props.pullData])

    const installed = props.installed || props.pullData?.status == "Already Installed"

    const { downloadModel,deleteModel } = useContext(OllamaServerContext)


    async function downloadButtonHandler() {
        if (pullData?.status == "Already Installed" || /Success|Pulling/.test(pullData?.status ?? "")) return
        await downloadModel(rawString, (chunk) => {
            setPullData(chunk)
        })
    }

    async function deleteButtonHandler() {
        await deleteModel(rawString, (chunk) => {
            setPullData(chunk)
        })
    }

    return <div id={`model-card`} className={`${pullData?.status == "Removed"?"removed":""}`}>
        <div className="main">
            <span className="name">{name}</span>
            <span className="tag">{tag}</span>
            {
                vision ?
                    <span className="vision">
                        <span className="material-symbols-outlined">
                        visibility
                        </span>
                    </span>
                    : null
            }
            {!pullData ? null :
                <>
                    {
                        <span className="status">{pullData?.status}</span>
                    }
                    {
                        !pullData.completed || !pullData.total ? null :
                            <span className="stage">{(pullData.completed / 1000 / 1000).toFixed(0)} / {(pullData.total / 1000 / 1000).toFixed(0)} MB</span>
                    }
                </>
            }
        </div>
        {
            desc ?
                <p className="desc">{desc}</p>
                : null
        }
        <div className="hideable">
            {
                !props.disableDownload ?
                    < button onClick={downloadButtonHandler} disabled={installed}>
                        Download <span className="material-symbols-outlined">
                            download
                        </span>
                    </button>
                    :
                    null
            }

            <button onClick={deleteButtonHandler} disabled={!installed}>
                Delete <span className="material-symbols-outlined">
                    delete
                </span>
            </button>

        </div>
    </div >
}

