import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export const OllamaServerContext = createContext<{
    ollamaAddress: string,
    ollamaPort: number | string,
    ollamaProto: string,
    ollamaURL: string,
    setOllamaAddress: (str: string) => void
    setOllamaPort: (str: string) => void
    setOllamaProto: (str: string) => void,
    downloadModel:(str:string,callback: (chunk: OllamaPullResponseChunk) => void)=>Promise<any>,
    deleteModel:(str:string,callback: (chunk: OllamaPullResponseChunk) => void)=>Promise<any>,
}>({
    ollamaAddress: "localhost",
    ollamaPort: 11434,
    ollamaProto: "http",
    ollamaURL: "http://localhost:11434",
    setOllamaAddress: () => null,
    setOllamaPort: () => null,
    setOllamaProto: () => null,
    downloadModel:()=>new Promise(()=>null),
    deleteModel:()=>new Promise(()=>null)
});

export default function OllamaServerProvider(props: PropsWithChildren) {
    const [ollamaAddress, setOllamaAddress] = useState<string>("not-loaded");
    const [ollamaPort, setOllamaPort] = useState<string>("not-loaded");
    const [ollamaProto, setOllamaProto] = useState<string>("not-loaded");

    async function downloadModel(model: string, callback: (chunk: OllamaPullResponseChunk) => void) {
      
        const res = await fetch(`${ollamaProto}://${ollamaAddress}:${ollamaPort}/api/pull`, {
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

    async function deleteModel(model: string, callback: (chunk: OllamaPullResponseChunk) => void) {
        console.log("deleting",model)
        const res = await fetch(`${ollamaProto}://${ollamaAddress}:${ollamaPort}/api/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "model": model
            })
        })

        if(res.ok){
            callback({status:"Removed",completed:1,total:1})
        }else{
            callback({status:"Problems with this model",completed:1,total:1})
        }
    }
    
    function setOllamaPortS(str:string){
        setOllamaPort(str)
        localStorage.setItem("ollama-port",str)
    }
    function setOllamaAddressS(str:string){
        setOllamaAddress(str)
        localStorage.setItem("ollama-address",str)
    }
    function setOllamaProtoS(str:string){
        setOllamaProto(str)
        localStorage.setItem("ollama-proto",str)
    }
    return <>
        <OllamaServerContext.Provider value={{
            setOllamaAddress :setOllamaAddressS,
            setOllamaPort :setOllamaPortS,
            setOllamaProto :setOllamaProtoS,
            downloadModel:downloadModel,
            deleteModel:deleteModel,
            ollamaAddress,
            ollamaPort,
            ollamaProto,
            ollamaURL: `${ollamaProto}://${ollamaAddress}:${ollamaPort}`
        }}>
            {props.children}
        </OllamaServerContext.Provider>
    </>
}

export function OllamaContextLoader(props: PropsWithChildren) {
    const { setOllamaAddress, setOllamaPort, setOllamaProto,ollamaPort } = useContext(OllamaServerContext)
    useEffect(() => {
        setOllamaAddress(localStorage.getItem("ollama-address") ?? "localhost")
        setOllamaPort(localStorage.getItem("ollama-port") ?? "11434")
        setOllamaProto(localStorage.getItem("ollama-proto") ?? "http")
    },[])

    return <>
        {ollamaPort != "not-loaded" ? props.children : null}
    </>
}