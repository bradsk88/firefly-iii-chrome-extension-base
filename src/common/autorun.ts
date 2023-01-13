function addLocationObserver(callback: () => void, subtree=false) {
    // Options for the observer (which mutations to observe)
    const config = {attributes: false, childList: true, subtree: subtree}

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback)

    // Start observing the target node for configured mutations
    observer.observe(document.body, config)
}

export function runOnContentChange(
    urlPath: string,
    func: () => void,
): void {
    let callback = () => {
        let curUrl = window.location.href.split('?')[0];
        if (curUrl.endsWith(urlPath)) {
            func();
        }
    };
    addLocationObserver(callback, true);
    callback();
}