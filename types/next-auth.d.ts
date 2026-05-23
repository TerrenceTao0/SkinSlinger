import NextAuth, { DefaultSession } from "next-auth";

//

declare module "next-auth" {
    interface User {
        steam_id?: string;
        steam_trade_url?: string;
        username?: string;
        cash?: number;
        lastInventoryRefresh?: Date | null;
    }

    interface Session {
        user: {
            id?: string;
            steam_id?: string;
            steam_trade_url?: string;
            username?: string;
            cash?: number;
            lastInventoryRefresh?: Date | null;
        } & DefaultSession["user"]
    }
}


declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        steam_id?: string;
        steam_trade_url?: string;
        username?: string;
        cash?: number;
        lastInventoryRefresh?: Date | null;
    }
}

