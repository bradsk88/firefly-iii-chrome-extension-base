import {AutoRunState} from "./auto_state";
import {autoRunStartURL} from "../extensionid";
import Tab = chrome.tabs.Tab;

setAutoRunState(AutoRunState.Unstarted);

let openedWindow: Tab | undefined;

export async function progressAutoRun(state = AutoRunState.Accounts) {
    await setAutoRunState(state)
    if (state === AutoRunState.Done) {
        if (!!openedWindow) {
            const id = openedWindow.id;
            openedWindow = undefined;
            return chrome.tabs.remove(id!);
        }
        return;
    }
    if (!openedWindow) {
        openedWindow = await chrome.tabs.create({
            url: autoRunStartURL,
            active: false,
        });
    }
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

export async function progressAutoTx(lastAccountName: string) {
    return setAutoRunLastTx(lastAccountName);
}

async function setAutoRunLastTx(accountName: string): Promise<void> {
    if (!accountName) {
        return chrome.storage.local.remove("ffiii_auto_run_last_transaction_account_name");
    }
    return chrome.storage.local.set({
        "ffiii_auto_run_last_transaction_account_name": accountName,
    })
    // TODO: [Base Project] Indicate transaction progress in addition to autorun stages?
    // chrome.runtime.sendMessage({
    //     action: "update_auto_run_progress",
    // })
}

export function getAutoRunLastTransaction(): Promise<string | undefined> {
    return chrome.storage.local.get(["ffiii_auto_run_last_transaction_account_name"]).then(r => {
        return r.ffiii_auto_run_last_transaction_account_name;
    });
}