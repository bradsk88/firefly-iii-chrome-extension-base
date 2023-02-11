import {TransactionStore} from "firefly-iii-typescript-sdk-fetch";
import {AccountStore} from "firefly-iii-typescript-sdk-fetch/dist/models";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {AutoRunState} from "./background/auto_state";
import {doOauth, getApiBaseUrl, getBearerToken} from "./background/oauth";
import {
    doListAccounts,
    doStoreAccounts,
    doStoreOpeningBalance,
    doStoreTransactions,
    OpeningBalance
} from "./background/firefly_export";
import {
    getAutoRunLastTransaction,
    getAutoRunState,
    progressAutoRun,
    progressAutoTx,
    setAutoRunState
} from "./background/auto";
import {
    bankDomain,
    extensionBankName,
    extensionPrimaryColorHex,
    extensionSecondaryColorHex,
    hubExtensionId
} from "./extensionid";

const backgroundLog = (string: string): void => {
    chrome.runtime.sendMessage({
        action: "log",
        value: string,
    }, () => {
    });
}

function registerSelfWithHubExtension() {
    console.log('registering self');
    chrome.runtime.sendMessage(hubExtensionId, {
        action: "register",
        extension: chrome.runtime.id,
        name: extensionBankName,
        primary_color_hex: extensionPrimaryColorHex,
        secondary_color_hex: extensionSecondaryColorHex,
    })
}

chrome.runtime.onStartup.addListener(function () {
    setTimeout(registerSelfWithHubExtension, 1000);
    setTimeout(registerSelfWithHubExtension, 5000);
})

setTimeout(registerSelfWithHubExtension, 1000);
setTimeout(registerSelfWithHubExtension, 5000);

chrome.runtime.onMessageExternal.addListener((msg: any, _: any, sendResponse: Function) => {
    console.log('message', msg);
    if (msg.action === "login") {
        return chrome.storage.local.set({
            "ffiii_bearer_token": msg.token,
            "ffiii_api_base_url": msg.api_base_url,
        }, () => {
        });
    }
    if (msg.action === "request_auto_run") {
        chrome.permissions.getAll(async perms => {
            await setAutoRunState(AutoRunState.Accounts);
            if ((perms.origins?.filter(o => !o.includes(bankDomain)) || []).length > 0) {
                await progressAutoRun();
            } else {
                chrome.runtime.openOptionsPage();
            }
        })
    }
    if (msg.action === 'cancel_auto_run') {
        chrome.permissions.getAll(async perms => {
            await setAutoRunState(AutoRunState.Unstarted);
        })
    }
    if (msg.action === 'get_auto_run_state') {
        getAutoRunState().then(state => sendResponse({
            state: state,
        }))
    }
})


async function storeAccounts(data: AccountStore[]) {
    getBearerToken().then(token => doStoreAccounts(token, data))
}

async function storeTransactions(data: TransactionStore[]) {
    getBearerToken().then(token => doStoreTransactions(token, data));
}

async function storeOpeningBalance(data: OpeningBalance) {
    getBearerToken().then(token => doStoreOpeningBalance(token, data));
}

export async function listAccounts(): Promise<AccountRead[]> {
    return getBearerToken().then(token => doListAccounts(token));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message', message);

    if (message.action === "submit") {
        doOauth(message.value).catch((error) => {
            backgroundLog(`[error] ${error}`)
        }).then(sendResponse)
    } else if (message.action === "store_accounts") {
        getAutoRunState().then(state => {
            if (message.is_auto_run && state === AutoRunState.Done) {
                return;
            }
            patchDatesAccount(message.value).then(
                accs => storeAccounts(accs),
            ).catch((error) => {
                backgroundLog(`[error] ${error}`)
            });
        }).then(sendResponse);
    } else if (message.action === "store_transactions") {
        getAutoRunState().then(state => {
            if (message.is_auto_run && state === AutoRunState.Done) {
                return;
            }
            patchDatesAndAvoidDupes(message.value).then(
                txStore => storeTransactions(txStore),
            ).catch((error) => {
                backgroundLog(`[error] ${error}`)
            });
        }).then(sendResponse)
    } else if (message.action === "store_opening") {
        patchDatesOB(message.value).then(
            obStore => storeOpeningBalance(obStore),
        ).catch((error) => {
            backgroundLog(`[error] ${error}`)
        });
    } else if (message.action === "list_accounts") {
        listAccounts().then(accounts => sendResponse(accounts));
    } else if (message.action === "try_resume_auto_run") {
        getAutoRunState()
            .then(s => {
                if (s === AutoRunState.Accounts) {
                    return progressAutoRun(s);
                }
            })
            .then(sendResponse)
    } else if (message.action === "get_auto_run_state") {
        getAutoRunState().then(state => sendResponse(state));
    } else if (message.action === "increment_auto_run_tx_account") {
        progressAutoTx(message.lastAccountNameCompleted).then(sendResponse);
    } else if (message.action === "get_auto_run_tx_last_account") {
        getAutoRunLastTransaction().then(accountNumber => sendResponse(accountNumber));
    } else if (message.action === "complete_auto_run_state") {
        if (message.state === AutoRunState.Accounts) {
            progressAutoRun(AutoRunState.Transactions).then(sendResponse);
        } else if (message.state === AutoRunState.Transactions) {
            progressAutoRun(AutoRunState.Done).then(sendResponse);
        }
    } else if (message.action === "check_base_url") {
        getApiBaseUrl().then(url => sendResponse(url));
    } else {
        backgroundLog(`[UNRECOGNIZED ACTION] ${message.action}`);
        return false;
    }
    return true
});

async function patchDatesAndAvoidDupes(data: TransactionStore[]): Promise<TransactionStore[]> {
    return data.map(ts => {
        ts.errorIfDuplicateHash = ts.errorIfDuplicateHash === undefined ? true : ts.errorIfDuplicateHash;
        ts.transactions = ts.transactions.map(v => {
            v.date = new Date(v.date); // Dates are converted to strings for message
            return v;
        })
        return ts;
    });
}

async function patchDatesOB(data: OpeningBalance): Promise<OpeningBalance> {
    data.date = new Date(data.date);
    return data;
}

async function patchDatesAccount(data: AccountStore[]): Promise<AccountStore[]> {
    return data.map(acc => {
        const d = acc.monthlyPaymentDate;
        acc.monthlyPaymentDate = d ? new Date(d) : d;
        const od = acc.openingBalanceDate;
        acc.openingBalanceDate = od ? new Date(od) : od;
        return acc;
    });
}