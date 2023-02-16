import {
    AccountRoleProperty,
    AccountStore,
    ShortAccountTypeProperty
} from "firefly-iii-typescript-sdk-fetch/dist/models";
import {AutoRunState} from "../background/auto_state";
import {
    getAccountElements,
    getAccountName,
    getAccountNumber,
    getButtonDestination,
    getOpeningBalance, isPageReadyForScraping
} from "./scrape/accounts";
import {openAccountForAutoRun} from "./auto_run/accounts";
import {runOnURLMatch} from "../common/buttons";
import {runOnContentChange} from "../common/autorun";
import {debugLog} from "./auto_run/debug";

let pageAlreadyScraped = false;
export let navigating = false;

export function setNavigating(): void {
    navigating = true;
}

async function scrapeAccountsFromPage(isAutoRun: boolean): Promise<AccountStore[]> {
    if (isAutoRun && pageAlreadyScraped) {
        throw new Error("Already scraped. Stopping.");
    }

    const accountElements = getAccountElements();
    if (accountElements?.length === 0) {
        throw new Error("Accounts are not present yet.")
    }
    const accounts = accountElements.map(element => {
        const accountNumber = getAccountNumber(element)
        const accountName = getAccountName(element);
        const openingBalance = getOpeningBalance(element);
        // TODO: Double-check these values. You may need to update them based
        //  on the account element or bank.
        let openingBalanceBalance: string | undefined;
        if (openingBalance) {
            openingBalanceBalance = `${openingBalance.balance}`;
        }
        const as: AccountStore = {
            // iban: "12345", // Not all banks have an IBAN
            // bic: "123", // Not all banks have an BIC
            name: accountName,
            accountNumber: accountNumber,
            openingBalance: openingBalanceBalance,
            openingBalanceDate: openingBalance?.date,
            type: ShortAccountTypeProperty.Asset,
            accountRole: AccountRoleProperty.DefaultAsset,
            currencyCode: "CAD",
        };
        return as;
    });
    pageAlreadyScraped = true;
    chrome.runtime.sendMessage(
        {
            action: "store_accounts",
            is_auto_run: isAutoRun,
            value: accounts,
        },
        () => {
        }
    );
    return accounts;
}

const buttonId = 'firefly-iii-export-accounts-button';

function addButton() {
    const button = document.createElement("button");
    button.id = buttonId;
    button.textContent = "Export Accounts"
    button.addEventListener("click", () => scrapeAccountsFromPage(false), false);
    getButtonDestination().append(button);
}

function enableAutoRun() {
    // This code is for executing the auto-run functionality for the hub extension
    // More Info: https://github.com/bradsk88/firefly-iii-chrome-extension-hub
    debugLog('in enableAutoRun')
    if (!isPageReadyForScraping()) {
        debugLog("Page is not ready for account scraping")
        return;
    }

    chrome.runtime.sendMessage({
        action: "get_auto_run_state",
    }).then(state => {
        debugLog("Got state", state)
        if (state === AutoRunState.Accounts) {
            debugLog('scraping page for accounts');
            scrapeAccountsFromPage(true)
                .then(() => chrome.runtime.sendMessage({
                    action: "complete_auto_run_state",
                    state: AutoRunState.Accounts,
                }))
                .then(() => openAccountForAutoRun())
                .catch(() => {
                    console.log('Error from account scrape. Will try again on next redraw')
                });
        } else if (state === AutoRunState.Transactions) {
            openAccountForAutoRun();
        }
    });
}

const accountsUrl = 'accounts/main/details'; // TODO: Set this to your accounts page URL

runOnURLMatch(accountsUrl, () => {
    pageAlreadyScraped = false;
    navigating = false;
});

runOnContentChange(
    accountsUrl,
    () => {
        if (!!document.getElementById(buttonId)) {
            return;
        }
        addButton();
    },
    getButtonDestination,
)


runOnContentChange(
    accountsUrl,
    enableAutoRun,
    // You might need to play with this. Some banks don't completely reload the
    // page. So you might need to observe a higher level DOM element, instead.
    // As a last resort, you can use document.body, but that will cause lag.
    () => getAccountElements()[0],
    'accounts',
)