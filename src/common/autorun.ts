import {debugLog} from "../content_scripts/auto_run/debug";

function addLocationObserver(
    callback: () => void,
    subtree=false,
    observeTarget: Node,
) {
    const config = {
        attributes: false,
        childList: true,
        subtree: subtree,
    }
    const observer = new MutationObserver(callback)
    observer.observe(observeTarget, config)
}

export function runOnContentChange(
    urlPath: string,
    func: () => void,
    observeTarget: (() => Node) = () => document.body,
    debugName?: string,
): void {
    if (!!observeTarget && !observeTarget()) {
        setTimeout(() => {
            debugLog(`observe target is missing [debugName: "${debugName}"]`)
            runOnContentChange(urlPath, func, observeTarget, debugName);
        }, 500)
        return;
    }

    if (!!observeTarget()) {
        debugLog(`observe target acquired [debugName: "${debugName}"]`)
    }

    let callback = () => {
        let curUrl = window.location.href.split('?')[0];
        if (curUrl.endsWith(urlPath)) {
            debugLog(window.location.href, 'matches (', urlPath, `) [debugName: "${debugName}"]`)
            func();
        } else {
            debugLog(window.location.href, ' is not a match for', urlPath, `[debugName: "${debugName}"]`)
        }
    };
    addLocationObserver(callback, true, observeTarget());
    callback();
}