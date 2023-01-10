import {TransactionStore} from "firefly-iii-typescript-sdk-fetch";
import {PageAccount} from "../../common/accounts";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";

/**
 * @param accounts The first page of account in your Firefly III instance
 */
export async function getCurrentPageAccount(
    accounts: AccountRead[],
): Promise<PageAccount> {
    // TODO: Find either the account number or account name on the page.
    const accountNumber = "<implement this>";
    // Use that to find the Firefly III account ID from the provided list.
    let acct = accounts.find(
        acct => acct.attributes.accountNumber === accountNumber,
    )!;
    return {
        id: acct.id,
        name: acct.attributes.name,
        accountNumber: acct.attributes.accountNumber || undefined,
    };
}

/**
 * @param pageAccountId The Firefly III account ID for the current page
 */
export function scrapeTransactionsFromPage(
    pageAccountId: string,
): TransactionStore[] {
    // TODO: This is where you implement the scraper to pull the individual
    //  transactions from the page
    return [];
}