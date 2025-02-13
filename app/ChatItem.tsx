import "./ChatItem.less";
import { defaultParser, Plugin } from "marceo";

export default function ChatItem(props: { message: OllamaHistoryItem, isWriting?: boolean }) {
    const content = props.message.content
        .replace(/<think>.*<\/think>/sg, "")
        .replace(/   -/g, "    -")
        .replace(/        -/g, "        -")
    // .replace(/^(?!#|( *)-|\d+\.).+$/mg, (s) => "<p>" + s + "</p>")
    return <div className={`chat-item ${props.message.role} ${props.message.errored ? "errored" : ""} ${props.isWriting ? "writing" : ""}`}>
        {

            content == "" ?
                <span className="loader"></span>
                :
                <div className="markdown" style={{ whiteSpace: props.isWriting ? "break-spaces" : "initial" }}>
                    {
                        !props.message.__extra || !props.message.__extra.rawImages ? null :
                            props.message.__extra.rawImages.map(img => <img className="markdown img image" src={img} />)
                    }
                    {!props.isWriting ?
                        <div dangerouslySetInnerHTML={
                            {
                                __html:
                                    defaultParser.parse(content)
                                        .replace(/\n/gs, "<#@nsbp@#>")
                                        .replace(/(<#@nsbp@#>)+/, "")
                                        .replace(/<#@nsbp@#>/g, "\n")
                            }
                        }></div>
                        : content
                    }
                </div>

        }
    </div>
}