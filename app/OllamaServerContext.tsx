import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export const OllamaServerContext = createContext<{
    ollamaAddress: string,
    ollamaPort: number | string,
    ollamaProto: string,
    ollamaURL: string,
    setOllamaAddress: (str: string) => void
    setOllamaPort: (str: string) => void
    setOllamaProto: (str: string) => void
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
    return <>
        <OllamaServerContext.Provider value={{
            setOllamaAddress,
            setOllamaPort,
            setOllamaProto,
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