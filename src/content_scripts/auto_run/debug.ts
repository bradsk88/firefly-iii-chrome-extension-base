import {debugAutoRun} from "../../extensionid";

const debugElementId = 'firefly-iii-extension-debug-output';

function addDebugElement() {
    const div = document.createElement("div");
    div.style.height = '100px';
    div.style.width = '400px';
    div.style.background = 'orange'
    div.style.color = 'white';
    div.style.fontWeight = 'bold';
    div.style.position = 'fixed';
    div.style.right = '0';
    div.style.bottom = '0';

    document.body.append(div)
    return div;
}

export function showDebug(s: string): void {
    let el = document.getElementById(debugElementId);
    if (!el) {
        el = addDebugElement();
    }
    el.innerHTML = s;
}

export function debugHighlight(h: HTMLElement): void {
    h.style.background = 'orange';
}

export function debugLog(s: string, ...vars: any): void {
    if (!debugAutoRun) {
        return;
    }
    console.debug(s, ...vars);
}