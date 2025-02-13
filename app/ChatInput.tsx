import React, { useEffect, useState, type Ref } from "react";
import "./ChatInput.less";

interface ChatInputAttachment { rawUrl: string, url: string }

export default function ChatInput(props: { onSubmit: (values: { text: string, attachments: ChatInputAttachment[] }) => Promise<boolean> }) {
    const [shiftPressed, setShiftPressed] = useState(false)
    const [playAnimation, setPlayAnimation] = useState("none")
    const [animationTimeout, setAnimationTimeout] = useState<NodeJS.Timeout>()
    const [attachments, setAttachments] = useState<ChatInputAttachment[]>([])

    useEffect(() => {
        clearTimeout(animationTimeout)
        const to = setTimeout(() => {
            setPlayAnimation("none")
        }, 1000)
        setAnimationTimeout(to)
    }, [playAnimation])

    return <>
        <div className={`chat-input-frame ${playAnimation}-anim`}>
            <label htmlFor="attachments-input">
                <span className="material-symbols-outlined">
                    attach_file
                </span>
            </label>
            <textarea className={`chat-input`} name="sentence" placeholder="Write here bro!"
                rows={1}
                onKeyUp={async (e) => {
                    if (e.key == "Enter" && !shiftPressed) {
                        if (e.currentTarget.value.trim() == "") {
                            setPlayAnimation("recuse")
                            return
                        }
                        e.preventDefault();
                        setPlayAnimation("send")
                        props.onSubmit({ text: e.currentTarget.value, attachments })
                        e.currentTarget.value = ''
                        setAttachments([])
                    }
                    if (e.key == "Shift") {
                        setShiftPressed(false)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key == "Enter" && !shiftPressed) e.preventDefault()
                    if (e.key == "Shift") setShiftPressed(true)
                }}
            />
            <input
                name="attachments-input" id="attachments-input"
                accept=".jpeg,.png,.jpg"
                hidden className="chat-attachment-input" type="file" onChange={async (e) => {
                    const reader = new FileReader()
                    const file = (e.target.files as FileList)[0]
                    const rawResult: string = await new Promise((res) => {
                        reader.onloadend = () => {
                            res(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                    })
                    const formatedResult = rawResult.replace(/^data:image\/.+?;base64,/, "")

                    setAttachments([{ rawUrl: rawResult, url: formatedResult }])
                }} />
            {
                attachments.map(im => <img src={im.rawUrl}></img>)
            }
        </div>
    </>
}