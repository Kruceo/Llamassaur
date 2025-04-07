import type { PropsWithChildren } from "react";
import "./Content.less";

export default function(props:PropsWithChildren){
    return <>
        <div className="mainly-content-window">{props.children}</div>
    </>
}