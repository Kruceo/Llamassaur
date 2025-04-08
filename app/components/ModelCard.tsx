import { useEffect, useState } from "react"
import "./ModelCard.less"
import type { Model } from "~/models"
export default function (props: { model: Model, status: string, vision?: boolean, desc?: string, installed?: boolean, disableDownload?: boolean, disableDelete?: boolean }) {
    const { desc, vision } = props

    const [status, setStatus] = useState(props.status)
    useEffect(() => { setStatus(props.status) }, [props.status])

    useEffect(() => {
        const id = props.model.addOnStatusChangeListener(setStatus)
        return () => props.model.removeOnStatusChangeListener(id.toString())
    }, [])

    const installed = props.installed || status == "Already Installed"

    async function downloadButtonHandler() {
        if (status == "Already Installed" || /success|pulling/.test(status ?? "")) return
        await props.model.download()
    }

    async function deleteButtonHandler() {
        if (status != "Removed")
            props.model.delete()
    }

    const [name, tag] = formatModelName(props.model.name).split(":")

    return <div id={`model-card`} className={`${status == "Removed" ? "removed" : ""}`}>
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

            <>
                {
                    <span style={{display:status==""?"none":"inline-block"}} className="status">{status}</span>
                }
            </>

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
            {
                !props.disableDelete ?
                    <button onClick={deleteButtonHandler} disabled={!installed}>
                        Delete <span className="material-symbols-outlined">
                            delete
                        </span>
                    </button>
                    : null
            }
        </div>
    </div >
}


function formatModelName(str: string) {
    return str.replace(/_|-/g, " ").replace(/^.*?\//, "")
}