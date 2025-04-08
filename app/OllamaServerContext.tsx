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
    // downloadModel:(str:string,callback: (chunk: OllamaPullResponseChunk) => void)=>Promise<any>,
    // deleteModel:(str:string,callback: (chunk: OllamaPullResponseChunk) => void)=>Promise<any>,
}>({
    ollamaAddress: "localhost",
    ollamaPort: 11434,
    ollamaProto: "http",
    ollamaURL: "http://localhost:11434",
    setOllamaAddress: () => null,
    setOllamaPort: () => null,
    setOllamaProto: () => null
});

export default function OllamaServerProvider(props: PropsWithChildren) {
    const [ollamaAddress, setOllamaAddress] = useState<string>("not-loaded");
    const [ollamaPort, setOllamaPort] = useState<string>("not-loaded");
    const [ollamaProto, setOllamaProto] = useState<string>("not-loaded");   
    
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