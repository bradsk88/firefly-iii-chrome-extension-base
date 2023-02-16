class URLMatchRunner {
    private lastURL = '';

    constructor(
        private readonly callback: (newURL: string) => void,
    ) {

    }

    addLocationObserver(): void {
        // Options for the observer (which mutations to observe)
        const config = {attributes: false, childList: true, subtree: false}

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(() => {
            const newURL = window.location.href.split('?')[0];
            if (newURL == this.lastURL) {
                return;
            }
            this.callback(newURL);
            this.lastURL = newURL;
        })

        // Start observing the target node for configured mutations
        observer.observe(document.body, config)
    }
}

export function runOnURLMatch(
    urlPath: string,
    func: () => void,
): void {
    let callback = (newURL: string) => {
        if (newURL.endsWith(urlPath)) {
            func();
        }
    };
    new URLMatchRunner(callback).addLocationObserver();
    callback(window.location.href);
}