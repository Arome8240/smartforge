import { PrivyClient } from "@privy-io/node";

const appId = "cmhzwck4300lajy0cbtmlmtxl";
const appSecret = "2ATNrd31uiWskM1rsdsu3SJgkppUG4efVEiinBye8sJPGbWafSeXvHHFabdrxBmkmpWerfBaPx3hASk2k9php2mc";

if (!appId || !appSecret) {
    throw new Error("Privy credentials are missing. Please set PRIVY_APP_ID and PRIVY_APP_SECRET.");
}

export const privyClient = new PrivyClient({
    appId,
    appSecret,
});
