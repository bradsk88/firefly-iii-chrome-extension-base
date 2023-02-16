import {sha512} from "js-sha512";
import {OpeningBalance} from "../../background/firefly_export";

export function getButtonDestination(): Element {
    // TODO: Find a DOM element on the page where the manual "export to firefly"
    //  button should go.
    return document.body;
}

export function isPageReadyForScraping(): boolean {
    // TODO: Some banks load accounts in slowly. Find a DOM element that is
    //  only present on the page once the accounts are fully loaded.
    return !!document.querySelector('span.account__details-number');
}

export function getAccountElements(): Element[] {
    // TODO: You'll almost certainly need to replace this with your own logic.
    //  This is grabbing the "rows" of accounts from the page.
    const forms = document.querySelectorAll('form[action="/Transactions/History"]');
    return Array.from(forms.values()).map(v => v.getElementsByTagName("button")[0]);
}

export function shouldSkipScrape(accountElement: Element): boolean {
    // TODO: If there are some types of accounts on the page that can't be
    //  scraped, return true for those here and they will be skipped.
    return false;
}

export function getAccountNumber(
    accountElement: Element,
): string {
    // TODO: You'll almost certainly need to replace this with your own logic.
    //  This is grabbing the BANK'S account number from the row (not Firefly's
    //  account ID).
    const input = accountElement.getElementsByTagName("input")[0];
    const accountNumber = input.attributes.getNamedItem('value')!.value;
    // If the account numbers on the page are long, SHA512 will make them a
    // consistent and acceptable length.
    // return sha512(accountNumber);
    return accountNumber;
}

export function getAccountName(
    accountElement: Element,
): string {
    // TODO: You'll almost certainly need to replace this with your own logic.
    //  This is grabbing the account name from the row.
    return accountElement.attributes
        .getNamedItem('aria-label')!.value
        .split('Transaction History for ')[1];
}

export function getOpeningBalance(
    accountElement: Element,
): OpeningBalance | undefined {
    // TODO: If you can confidently determine the opening balance, do that here.
    //  When in doubt, return undefined.
    return undefined;
}