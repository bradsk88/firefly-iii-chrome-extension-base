import {TransactionStore} from "firefly-iii-typescript-sdk-fetch";
import {AutoRunState} from "../background/auto_state";
import {getCurrentPageAccount, scrapeTransactionsFromPage} from "./scrape/transactions";
import {PageAccount} from "../common/accounts";
import {runOnURLMatch} from "../common/buttons";
import {runOnContentChange} from "../common/autorun";

// TODO: You will need to update manifest.json so this file will be loaded on
//  the correct URL.

interface TransactionScrape {
    pageAccount: PageAccount;
    pageTransactions: TransactionStore[];
}

let pageAlreadyScraped = false;

async function doScrape(isAutoRun: boolean): Promise<TransactionScrape> {
    if (isAutoRun && pageAlreadyScraped) {
        throw new Error("Already scraped. Stopping.");
    }

    const accounts = await chrome.runtime.sendMessage({
        action: "list_accounts",
    });
    const id = await getCurrentPageAccount(accounts);
    const txs = scrapeTransactionsFromPage(id.id);
    pageAlreadyScraped = true;
    await chrome.runtime.sendMessage({
            action: "store_transactions",
            is_auto_run: isAutoRun,
            value: txs,
        },
        () => {
        });
    return {
        pageAccount: id,
        pageTransactions: txs,
    };
}

const buttonId = 'firefly-iii-export-transactions-button';

function addButton() {
    // TODO: This is where you add a "scrape" button to the page where the
    //  account's transactions are listed.
    const button = document.createElement("button");
    button.textContent = "Export Transactions"
    button.addEventListener("click", async () => doScrape(false), false);
    // TODO: Try to steal styling from the page to make this look good :)
    button.classList.add("some", "classes", "from", "the", "page");
    document.body.append(button);
}

function enableAutoRun() {
    chrome.runtime.sendMessage({
        action: "get_auto_run_state",
    }).then(state => {
        if (state === AutoRunState.Transactions) {
            doScrape(true)
                .then((id: TransactionScrape) => chrome.runtime.sendMessage({
                    action: "increment_auto_run_tx_account",
                    lastAccountNameCompleted: id.pageAccount.name,
                }, () => {
                }));
        }
    });
}

// If your manifest.json allows your content script to run on multiple pages,
// you can call this function more than once, or set the urlPath to "".
runOnURLMatch(
    'accounts/main/details', // TODO: Set this to your transactions page URL
    () => !!document.getElementById(buttonId),
    () => {
        pageAlreadyScraped = false;
        addButton();
    },
)

runOnContentChange(
    'accounts/main/details', // TODO: Set this to your transactions page URL
    enableAutoRun,
)
