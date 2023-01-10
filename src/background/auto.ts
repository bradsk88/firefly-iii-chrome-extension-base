import {AutoRunState} from "./auto_state";
import Tab = chrome.tabs.Tab;

let openedWindow: Tab;

export async function progressAutoRun(state = AutoRunState.Accounts) {
    await setAutoRunState(state)
    if (openedWindow) {
        chrome.tabs.remove(openedWindow.id!)
    }
    if (state === AutoRunState.Done) {
        return;
    }
    openedWindow = await chrome.tabs.create({
        url: 'https://personal.affinitycu.ca/Accounts/Summary',
        active: false,
    })
}

async function setAutoRunState(s: AutoRunState): Promise<void> {
    return setAutoRunLastTx("")
        .then(() => chrome.storage.local.set({
            "ffiii_auto_run_state": s,
        }))
        .then(() => console.log('stored state', s))
        .then(() => chrome.runtime.sendMessage({
            action: "update_auto_run_progress",
        }, () => {
        }));
}

export function getAutoRunState(): Promise<AutoRunState> {
    return chrome.storage.local.get(["ffiii_auto_run_state"]).then(r => {
        return r.ffiii_auto_run_state || AutoRunState.Unstarted;
    });
}

export function progressAutoTx(lastAccountName: string) {
    setAutoRunLastTx(lastAccountName)
        .then(() => openedWindow ? chrome.tabs.remove(openedWindow.id!) : undefined)
        .then(() => chrome.tabs.create({
            url: 'https://personal.affinitycu.ca/Accounts/Summary',
            active: false,
        }))
        .then(tab => openedWindow = tab);
}

async function setAutoRunLastTx(accountName: string): Promise<void> {
    if (!accountName) {
        return chrome.storage.local.remove("ffiii_auto_run_last_transaction_account_name");
    }
    return chrome.storage.local.set({
        "ffiii_auto_run_last_transaction_account_name": accountName,
    })
    // TODO: Indicate transaction progress in addition to autorun stages?
    // chrome.runtime.sendMessage({
    //     action: "update_auto_run_progress",
    // })
}

export function getAutoRunLastTransaction(): Promise<string | undefined> {
    return chrome.storage.local.get(["ffiii_auto_run_last_transaction_account_name"]).then(r => {
        return r.ffiii_auto_run_last_transaction_account_name;
    });
}