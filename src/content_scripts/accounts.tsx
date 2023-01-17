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
    getOpeningBalance
} from "./scrape/accounts";
import {openAccountForAutoRun} from "./auto_run/accounts";
import {runOnURLMatch} from "../common/buttons";
import {runOnContentChange} from "../common/autorun";

// TODO: You will need to update manifest.json so this file will be loaded on
//  the correct URL.

let pageAlreadyScraped = false;

async function scrapeAccountsFromPage(isAutoRun: boolean): Promise<AccountStore[]> {
    if (isAutoRun && pageAlreadyScraped) {
        throw new Error("Already scraped. Stopping.");
    }

    const accounts = getAccountElements().map(element => {
        const accountNumber = getAccountNumber(element)
        const accountName = getAccountName(element);
        const openingBalance = getOpeningBalance(element);
        // TODO: Double-check these values. You may need to update them based
        //  on the account element or bank.
        let openingBalanceBalance: string | undefined;
        if (openingBalance) {
            openingBalanceBalance = `-${openingBalance.balance}`;
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
    chrome.runtime.sendMessage({
        action: "get_auto_run_state",
    }).then(state => {
        if (state === AutoRunState.Accounts) {
            scrapeAccountsFromPage(true)
                .then(() => chrome.runtime.sendMessage({
                    action: "complete_auto_run_state",
                    state: AutoRunState.Accounts,
                }));
        } else if (state === AutoRunState.Transactions) {
            openAccountForAutoRun();
        }
    });
}

runOnURLMatch(
    'accounts/main/details', // TODO: Set this to your accounts page URL
    () => !!document.getElementById(buttonId),
    () => {
        pageAlreadyScraped = false;
        addButton();
    },
);

runOnContentChange(
    'accounts/main/details', // TODO: Set this to your accounts page URL
    enableAutoRun,
)