import type { PropsWithChildren } from "react";
import "./TopDock.less";
export default function (props:PropsWithChildren) {
    return <header className="t-dock">{props.children}</header>
}
