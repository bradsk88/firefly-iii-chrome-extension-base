import {findBackToAccountsPageButton} from "../scrape/transactions";
import {debugAutoRun} from "../../extensionid";
import {debugHighlight, showDebug} from "./debug";

export async function backToAccountsPage(): Promise<void> {
    let btn = findBackToAccountsPageButton();
    if (debugAutoRun) {
        showDebug("The highlighted element would be clicked to return to the accounts page. But debug mode is on." +
            "<br>Click it yourself to continue the auto-run procedure.")
        debugHighlight(btn);
    } else {
        btn.click();
    }
}