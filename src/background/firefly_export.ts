import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {AccountsApi, Configuration, TransactionsApi, TransactionStore} from "firefly-iii-typescript-sdk-fetch";
import {AccountArray, AccountStore} from "firefly-iii-typescript-sdk-fetch/dist/models";

export interface OpeningBalance {
    accountNumber: string;
    accountName: string;
    balance: number;
    date: Date;
}

export async function doListAccounts(
    token: string,
): Promise<AccountRead[]> {
    let api = new AccountsApi(
        new Configuration({
            basePath: "http://192.168.0.124:4575",
            accessToken: `Bearer ${token}`,
            headers: {
                "Content-Type": "application/json",
                "accept": "application/vnd.api+json",
            },
            fetchApi: self.fetch.bind(self),
        }),
    );
    return api.listAccount({
        // TODO: [Base Project] Handle lots of accounts (multiple pages)
    }).then(
        (arr: AccountArray) => arr.data,
    );
}

export function doStoreOpeningBalance(token: string, data: OpeningBalance) {
    let api = new AccountsApi(
        new Configuration({
            basePath: "http://192.168.0.124:4575",
            accessToken: `Bearer ${token}`,
            headers: {
                "Content-Type": "application/json",
                "accept": "application/vnd.api+json",
            },
            fetchApi: self.fetch.bind(self),
        }),
    );
    api.updateAccount({
        id: data.accountNumber,
        accountUpdate: {
            name: data.accountName,
            openingBalance: `${data.balance}`,
            openingBalanceDate: data.date,
        }
    })
}

export function doStoreTransactions(token: string, data: TransactionStore[]) {
    let api = new TransactionsApi(
        new Configuration({
            basePath: "http://192.168.0.124:4575",
            accessToken: `Bearer ${token}`,
            headers: {
                "Content-Type": "application/json",
                "accept": "application/vnd.api+json",
            },
            fetchApi: self.fetch.bind(self),
        }),
    );
    console.log('storing txs', data);
    data.forEach(txStore => api.storeTransaction({
        transactionStore: txStore,
    }));
}

export function doStoreAccounts(token: string, data: AccountStore[]) {
    let api = new AccountsApi(
        new Configuration({
            basePath: "http://192.168.0.124:4575",
            accessToken: `Bearer ${token}`,
            headers: {
                "Content-Type": "application/json",
                "accept": "application/vnd.api+json",
            },
            fetchApi: self.fetch.bind(self),
        }),
    );
    // api.listAccount({}).then((r: any) => backgroundLog(JSON.stringify(r)));
    data.forEach(accountStore => api.storeAccount({accountStore: accountStore}));
}