import { prisma } from "@/lib/db";
import HomeClient from "./components/HomeClient";

//

const PAGE_SIZE = 30;

//

export default async function App() {
    const rows = await prisma.item_listing.findMany({
        take: PAGE_SIZE + 1,
        orderBy: { price: "desc" },
    });


    const page = rows.slice(0, PAGE_SIZE);
    const hasMore = rows.length > PAGE_SIZE;

    const assetIds = page.map(listing => listing.assetId);
    const inventoryItems = await prisma.inventory_item.findMany({ where: { assetId: { in: assetIds } } });
    const itemMap = new Map(inventoryItems.map(item => [item.assetId, item]));

    const cards = page
        .map(listing => ({ ...listing, inv: itemMap.get(listing.assetId) }))
        .filter(listing => listing.inv)
        .map(listing => ({
            id: listing.id,
            marketName: listing.marketName,
            price: listing.price,
            icon: listing.inv!.icon,
            hexColor: listing.inv!.hexColor,
            game: listing.inv!.game,
            commodity: listing.inv!.commodity,
        }));


    return <HomeClient initialListings={cards} initialHasMore={hasMore} />;
}

