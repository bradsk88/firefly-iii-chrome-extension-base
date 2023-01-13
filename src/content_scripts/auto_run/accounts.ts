import {sha512} from "js-sha512";
import {AutoRunState} from "../../background/auto_state";
import {getAccountElements, getAccountName} from "../scrape/accounts";

function findNextAccountElement(accountName: string): Element | undefined {
    // You probably shouldn't need to modify the function.
    // It scans the account "elements" on the page and returns the one that is
    // AFTER the last account whose transactions were scraped.
    let foundScraped = false;
    for (const button of getAccountElements()) {
        if (!accountName) {
            return button;
        }
        if (foundScraped) {
            return button;
        }
        if (getAccountName(button) === accountName) {
            foundScraped = true;
        }
    }
}

function navigateToAccount(
    accountElement: Element,
): void {
    // TODO: In order to scrape transactions, we need to navigate to
    //  each account. This template assumes it's a button you can "click".
    (accountElement as HTMLButtonElement)?.click()
}

export function openAccountForAutoRun() {
    // Be careful changing this function. The auto run orchestration is fragile.
    chrome.runtime.sendMessage({action: "get_auto_run_tx_last_account"})
        .then(account => findNextAccountElement(account))
        .then(accountElement => {
            if (accountElement) {
                navigateToAccount(accountElement);
                return;
            }
            chrome.runtime.sendMessage({
                action: "complete_auto_run_state",
                state: AutoRunState.Transactions,
            });
        });
}