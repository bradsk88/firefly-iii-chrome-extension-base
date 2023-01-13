import {AutoRunState} from "../background/auto_state";
import {runOnContentChange} from "../common/autorun";

// TODO: You will need to update manifest.json so this file will be loaded on
//  the correct URL(s)

function buildCol() {
    // TODO: These are just some default styles for the status bar.
    //  It should be fine to style these however you please.
    const col = document.createElement("td");
    col.style.width = "40px";
    col.style.background = "white";
    col.style.height = "100%";
    return col;
}

let statusBarId = 'firefly-extension-autorun-status-bar';

function buildStatusBar(acctCol: HTMLTableCellElement, txCol: HTMLTableCellElement, doneCol: HTMLTableCellElement) {
    // TODO: These are just some default styles for the status bar.
    //  It should be fine to style these however you please.
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.right = "0";
    container.style.height = "20px";

    const table = document.createElement("table")
    table.style.margin = "0 auto";
    table.style.height = "100%";

    table.append(acctCol, txCol, doneCol)

    container.append(table);
    container.id = statusBarId;
    return container;
}

runOnContentChange(
    '',
    () => {
        if (document.getElementById(statusBarId)) {
            return;
        }
        const [acctCol, txCol, doneCol] = [buildCol(), buildCol(), buildCol()];
        const statusBar = buildStatusBar(acctCol, txCol, doneCol);

        document.body.append(statusBar);

        const updateProgressBar = () => {
            chrome.runtime.sendMessage({
                action: "get_auto_run_state",
            }).then(
                state => {
                    if (state === AutoRunState.Unstarted) {
                        return;
                    }
                    acctCol.style.background = "white";
                    txCol.style.background = "white";
                    doneCol.style.background = "white";
                    if (state === AutoRunState.Accounts) {
                        acctCol.style.background = "blue";
                    } else if (state === AutoRunState.Transactions) {
                        acctCol.style.background = "blue";
                        txCol.style.background = "blue";
                    } else if (state === AutoRunState.Done) {
                        acctCol.style.background = "blue";
                        txCol.style.background = "blue";
                        doneCol.style.background = "blue";
                    }
                }
            )
        }
        updateProgressBar();

        chrome.runtime.onMessage.addListener((message) => {
            if (message.action !== "update_auto_run_progress") {
                return false;
            }
            updateProgressBar();
            return true;
        })
    }
)
window.addEventListener("load", function (event) {

});