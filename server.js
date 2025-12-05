// server.js
require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

// ======= Config =======
const PORT = Number(process.env.PORT || 3000);
const SIMULATE_MINT = process.env.SIMULATE_MINT === "true";
const COOLDOWN_MS = Number(process.env.COOLDOWN_MS || 3600000);
const DEFAULT_RADIUS = Number(process.env.CLAIM_RADIUS_M || 150);

// ======= In-memory persistence (toggleable external DB later) =======
const players = {}; // { [wallet]: Player }

const locations = {
    nukaTown: {
        id: "nukaTown",
        name: "NukaTown",
        lat: 36.025,
        lng: -115.037,
        radiusM: DEFAULT_RADIUS,
        lootTable: [
            { id: "scrap_metal", name: "Scrap Metal", type: "material", weight: 50, rarity: "common", stats: { value: 1 } },
            { id: "ammo_pack", name: "Ammo Pack", type: "consumable", weight: 30, rarity: "uncommon", stats: { ammo: 20 } },
            { id: "rare_tech", name: "Rare Tech", type: "material", weight: 15, rarity: "rare", stats: { intel: 5 } },
            { id: "legendary_relic", name: "Legendary Relic", type: "artifact", weight: 5, rarity: "legendary", stats: { charisma: 10 } }
        ]
    },
    vault13: {
        id: "vault13",
        name: "Vault 13",
        lat: 36.03,
        lng: -115.02,
        radiusM: 100,
        lootTable: [
            { id: "duct_tape", name: "Duct Tape", type: "material", weight: 40, rarity: "common", stats: { value: 1 } },
            { id: "med_x", name: "Med-X", type: "consumable", weight: 25, rarity: "uncommon", stats: { heal: 15 } },
            { id: "laser_rifle", name: "Laser Rifle", type: "weapon", weight: 20, rarity: "rare", stats: { attack: 25, energy: true } },
            { id: "t45_power_armor", name: "T-45 Power Armor", type: "body", weight: 15, rarity: "legendary", stats: { defense: 30, carry: 10 } }
        ]
    }
};

// ======= Utility functions =======

// Weighted roll from loot table, factoring faction reputation influence
function rollLoot(lootTable, player) {
    const repBonus = Math.min(0.20, (player?.factionRep?.brotherhood || 0) * 0.002); // up to +20% weight for better loot
    const adjusted = lootTable.map(e => {
        const bonus = (e.rarity === "rare" || e.rarity === "legendary") ? repBonus : 0;
        return { ...e, weight: e.weight * (1 + bonus) };
    });
    const total = adjusted.reduce((sum, e) => sum + e.weight, 0);
    let r = Math.random() * total;
    for (const e of adjusted) {
        if ((r -= e.weight) <= 0) return e;
    }
    return null;
}

// Distance between GPS coordinates in meters (Haversine)
function distanceM(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

// Ensure player exists
function ensurePlayer(wallet) {
    if (!players[wallet]) {
        players[wallet] = {
            wallet,
            caps: 0,
            lvl: 1,
            xp: 0,
            hp: 100,
            max_hp: 100,
            lastClaim: 0,
            factionRep: { brotherhood: 0, raiders: 0, vault: 0 },
            inventory: [],
            gear: { head: null, body: null, weapon: null, accessory: null },
            cooldowns: { claim: 0 }
        };
    }
    return players[wallet];
}

// Leveling by XP thresholds
function grantCapsAndXp(player, capsEarned, xpEarned) {
    player.caps += capsEarned;
    player.xp += xpEarned;
    const nextLvXp = player.lvl * 100;
    let leveledUp = false;
    while (player.xp >= nextLvXp) {
        player.xp -= nextLvXp;
        player.lvl += 1;
        player.max_hp += 10;
        player.hp = player.max_hp;
        leveledUp = true;
    }
    return { leveledUp };
}

// Random encounters with faction effects
function rollEncounter(player) {
    const roll = Math.random();
    if (roll < 0.18) {
        player.hp = Math.max(0, player.hp - 12);
        player.factionRep.raiders += 4;
        return "Raider ambush! Lost 12 HP.";
    } else if (roll < 0.28) {
        player.factionRep.brotherhood += 6;
        return "Brotherhood patrol! Gained 6 reputation.";
    } else if (roll < 0.34) {
        player.hp = Math.min(player.max_hp, player.hp + 12);
        player.factionRep.vault += 5;
        return "Vault Dweller aid! Restored 12 HP.";
    }
    return null;
}

// Equip gear into slots (validates types)
function equipItem(player, itemId) {
    const item = player.inventory.find(i => i.id === itemId);
    if (!item) return { error: "Item not found" };
    const slot = item.type === "head" ? "head"
        : item.type === "body" ? "body"
            : item.type === "weapon" ? "weapon"
                : item.type === "accessory" ? "accessory" : null;
    if (!slot) return { error: "Item is not equippable" };
    player.gear[slot] = item;
    // Passive stat effects example:
    if (item.stats?.defense) {
        player.max_hp = 100 + (item.stats.defense || 0);
        player.hp = Math.min(player.hp, player.max_hp);
    }
    return { success: true, slot, item };
}

// Simple crafting: consumes materials to create gear
function craftItem(player, recipeId) {
    const recipes = {
        "scav_helmet": {
            name: "Scavenger Helmet",
            type: "head",
            rarity: "uncommon",
            requires: { scrap_metal: 3, duct_tape: 1 },
            stats: { defense: 5 }
        },
        "makeshift_rifle": {
            name: "Makeshift Rifle",
            type: "weapon",
            rarity: "uncommon",
            requires: { scrap_metal: 2, rare_tech: 1 },
            stats: { attack: 12 }
        }
    };
    const recipe = recipes[recipeId];
    if (!recipe) return { error: "Unknown recipe" };

    // Check inventory materials
    const needed = { ...recipe.requires };
    const bag = {};
    player.inventory.forEach((it, idx) => {
        bag[it.id] = bag[it.id] || [];
        bag[it.id].push(idx);
    });
    for (const matId of Object.keys(needed)) {
        const have = (bag[matId]?.length || 0);
        if (have < needed[matId]) return { error: `Missing ${matId} x${needed[matId] - have}` };
    }

    // Consume materials
    for (const matId of Object.keys(needed)) {
        for (let i = 0; i < needed[matId]; i++) {
            const idx = bag[matId].pop();
            player.inventory.splice(idx, 1);
        }
    }

    // Add crafted item
    const crafted = {
        id: `${recipeId}_${Date.now()}`,
        name: recipe.name,
        type: recipe.type,
        rarity: recipe.rarity,
        stats: recipe.stats,
        source: "crafting",
        ts: Date.now()
    };
    player.inventory.push(crafted);
    return { success: true, item: crafted };
}

// ======= Optional Solana + NFT stubs (wire your real integrations) =======
async function maybeMintCapsOnChain(wallet, caps) {
    if (SIMULATE_MINT) return { tx: "SIMULATED_TX" };
    try {
        const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
        const { getOrCreateAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
        const bs58 = require("bs58");

        const connection = new Connection(process.env.SOLANA_RPC || "https://api.devnet.solana.com", "confirmed");
        const secret = Buffer.from(process.env.PRIVATE_KEY_BASE64, "base64");
        const mintAuthority = Keypair.fromSecretKey(secret);
        const mint = new PublicKey(process.env.CAPS_MINT);
        const dest = new PublicKey(wallet);

        const ata = await getOrCreateAssociatedTokenAccount(connection, mintAuthority, mint, dest);
        const sig = await mintTo(connection, mintAuthority, mint, ata.address, mintAuthority, BigInt(caps) * BigInt(1_000_000_000));
        return { tx: sig, explorer: `https://solscan.io/tx/${sig}?cluster=devnet` };
    } catch (e) {
        return { error: "Mint failed", detail: `${e}` };
    }
}

async function maybeMintNftForLoot(loot, wallet) {
    if (!loot || (loot.rarity !== "rare" && loot.rarity !== "legendary")) return null;
    if (SIMULATE_MINT) {
        return { nftMint: "SIMULATED_NFT", name: loot.name, rarity: loot.rarity };
    }
    // Placeholder: integrate Metaplex NFT mint here and return the mint address
    // const nftMint = await mintNft(metadata, wallet);
    return null;
}

// ======= Endpoints =======

// Player profile
app.get("/player/:wallet", (req, res) => {
    const player = ensurePlayer(req.params.wallet);
    res.json(player);
});

// Balance
app.get("/balance/:wallet", (req, res) => {
    const player = ensurePlayer(req.params.wallet);
    res.json({ wallet: player.wallet, caps: player.caps });
});

// Inventory
app.get("/inventory/:wallet", (req, res) => {
    const player = ensurePlayer(req.params.wallet);
    res.json({ inventory: player.inventory, gear: player.gear });
});

// Equip item
app.post("/equip", (req, res) => {
    const { wallet, itemId } = req.body;
    if (!wallet || !itemId) return res.status(400).json({ error: "Missing wallet or itemId" });
    const player = ensurePlayer(wallet);
    const result = equipItem(player, itemId);
    if (result.error) return res.status(400).json(result);
    res.json(result);
});

// Craft item
app.post("/craft", (req, res) => {
    const { wallet, recipeId } = req.body;
    if (!wallet || !recipeId) return res.status(400).json({ error: "Missing wallet or recipeId" });
    const player = ensurePlayer(wallet);
    const result = craftItem(player, recipeId);
    if (result.error) return res.status(400).json(result);
    res.json(result);
});

// Factions
app.get("/factions/:wallet", (req, res) => {
    const p = ensurePlayer(req.params.wallet);
    res.json(p.factionRep);
});

app.post("/factions/adjust", (req, res) => {
    const { wallet, faction, delta } = req.body;
    const p = ensurePlayer(wallet);
    if (!["brotherhood", "raiders", "vault"].includes(faction)) {
        return res.status(400).json({ error: "Invalid faction" });
    }
    p.factionRep[faction] += Number(delta || 0);
    res.json({ faction, value: p.factionRep[faction] });
});

// Events (simple rotating example)
app.get("/events", (req, res) => {
    const now = new Date();
    const hour = now.getUTCHours();
    const event = (hour % 2 === 0)
        ? { name: "Brotherhood Patrol", locationId: "vault13", bonusCaps: 20 }
        : { name: "Raider Skirmish", locationId: "nukaTown", riskHP: 10 };
    res.json({ active: event, nextCheckAt: Date.now() + 600000 });
});

// Claim survival: GPS, loot, encounter, caps/xp, optional on-chain mint + NFT
app.post("/claim-survival", async (req, res) => {
    const { wallet, locationId, lat, lng, eventName } = req.body;
    if (!wallet || !locationId) return res.status(400).json({ error: "Missing wallet or locationId" });

    const loc = locations[locationId];
    if (!loc) return res.status(404).json({ error: "Unknown location" });

    const player = ensurePlayer(wallet);
    const now = Date.now();

    // Cooldown
    const last = player.cooldowns.claim || 0;
    if (now - last < COOLDOWN_MS) {
        const remaining = COOLDOWN_MS - (now - last);
        return res.status(429).json({ error: "Cooldown active", remainingMs: remaining });
    }

    // GPS proximity check
    if (lat != null && lng != null) {
        const dist = distanceM(lat, lng, loc.lat, loc.lng);
        if (dist > (loc.radiusM || DEFAULT_RADIUS)) {
            return res.status(403).json({ error: "Out of range", distanceM: Math.round(dist), allowedM: loc.radiusM });
        }
    }

    // Event modifiers
    let capsMod = 0;
    let hpRisk = 0;
    if (eventName === "Brotherhood Patrol" && locationId === "vault13") capsMod += 20;
    if (eventName === "Raider Skirmish" && locationId === "nukaTown") hpRisk += 10;

    player.cooldowns.claim = now;

    // Loot roll
    const loot = rollLoot(loc.lootTable, player);
    let lootItem = null;
    if (loot) {
        lootItem = {
            id: loot.id,
            name: loot.name,
            type: loot.type,
            rarity: loot.rarity,
            stats: loot.stats,
            source: loc.name,
            ts: now
        };
        // Optional NFT reward on rare/legendary
        const nft = await maybeMintNftForLoot(loot, wallet);
        if (nft?.nftMint) lootItem.nftMint = nft.nftMint;
        player.inventory.push(lootItem);
    }

    // Encounter
    const encounter = rollEncounter(player);
    if (hpRisk > 0) {
        player.hp = Math.max(0, player.hp - hpRisk);
    }

    // Rewards and progression
    const baseCaps = 12;
    const rarityBonus = loot?.rarity === "legendary" ? 60 : loot?.rarity === "rare" ? 24 : 0;
    const capsEarned = baseCaps + rarityBonus + capsMod;
    const { leveledUp } = grantCapsAndXp(player, capsEarned, 18);

    // Optional on-chain CAPS mint (if not simulating)
    let chain = null;
    if (!SIMULATE_MINT) {
        chain = await maybeMintCapsOnChain(wallet, capsEarned);
    }

    res.json({
        success: true,
        location: loc.name,
        loot: lootItem,
        encounter,
        capsEarned,
        leveledUp,
        player: {
            wallet: player.wallet,
            caps: player.caps,
            lvl: player.lvl,
            xp: player.xp,
            hp: player.hp,
            max_hp: player.max_hp,
            factionRep: player.factionRep,
            inventoryCount: player.inventory.length,
            gear: player.gear
        },
        chain,
        cooldownEndsAt: player.cooldowns.claim + COOLDOWN_MS
    });
});

// ======= Startup =======
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} | simulate mint: ${SIMULATE_MINT}`);
});
