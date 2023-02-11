// TODO: Add this to base project
import {findBackToAccountsPageButton} from "../scrape/transactions";

export async function backToAccountsPage(): Promise<void> {
    findBackToAccountsPageButton().click();
}