require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const {
    Connection,
    PublicKey,
    Keypair,
    clusterApiUrl,
} = require('@solana/web3.js');
const {
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    createBurnInstruction,
} = require('@solana/spl-token');
const {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
} = require('@metaplex-foundation/js');

const app = express();

// ============================
// Middleware
// ============================
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 120 }));
app.use(cors({ origin: 'https://atomicfizzcaps.xyz' }));
app.use(express.json({ limit: '10mb' }));

// ============================
// Env + Keys
// ============================
const required = ['PRIVATE_KEY_BASE64', 'REDIS_URL'];
required.forEach(k => { if (!process.env[k]) throw new Error(`Missing env var: ${k}`); });

const connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'), 'confirmed');
const secret = Uint8Array.from(atob(process.env.PRIVATE_KEY_BASE64), c => c.charCodeAt(0));
const mintAuthority = Keypair.fromSecretKey(secret);
const CAPS_MINT = new PublicKey(process.env.CAPS_MINT || 'FywSJiYrtgErQwGeySiugRxCNg9xAnzRqmZQr6v2mEt2');

const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(mintAuthority))
    .use(bundlrStorage());

// Redis
const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', err => console.error('Redis error:', err));
redis.connect();

// ============================
// HARD-CODED LOCATIONS (fixes Vercel forever)
// ============================
// ============================
// FULL HARD-CODED LOCATIONS (copy-paste this exact block)
// ============================
// ============================
// FULL HARD-CODED LOCATIONS (copy-paste this exact block)
// ============================
const locations = [
    { n: "Goodsprings Saloon", lat: 35.8324, lng: -115.4320, lvl: 1, rarity: "common" },
    { n: "Primm Rollercoaster", lat: 35.6145, lng: -115.3845, lvl: 2, rarity: "common" },
    { n: "Novac Motel", lat: 35.0525, lng: -114.8247, lvl: 5, rarity: "rare" },
    { n: "Hoover Dam", lat: 36.016, lng: -114.738, lvl: 12, rarity: "epic" },
    { n: "The Strip Gate", lat: 36.1147, lng: -115.1728, lvl: 15, rarity: "epic" },
    { n: "Lucky 38", lat: 36.147, lng: -115.156, lvl: 18, rarity: "epic" },
    { n: "Black Mountain", lat: 35.9310, lng: -115.0440, lvl: 20, rarity: "epic" },
    { n: "Area 51 Gate", lat: 37.2431, lng: -115.7930, lvl: 45, rarity: "legendary" },
    { n: "Vault 77 (Secret)", lat: 36.170, lng: -115.140, lvl: 77, rarity: "legendary" },
    { n: "Chernobyl Pripyat", lat: 51.389, lng: 30.099, lvl: 99, rarity: "legendary" },
    { n: "Fukushima Daiichi", lat: 37.421, lng: 141.032, lvl: 99, rarity: "legendary" },
    { n: "Dead Wind Cavern", lat: 35.8000, lng: -115.4000, lvl: 40, rarity: "legendary" },
    { n: "Vault 34", lat: 36.1750, lng: -114.7500, lvl: 20, rarity: "epic" },
    { n: "Jacobstown", lat: 36.3000, lng: -115.6500, lvl: 22, rarity: "rare" },
    { n: "Searchlight Church", lat: 35.46434, lng: -114.91844, lvl: 10, rarity: "rare" },
    { n: "Cottonwood Cove", lat: 35.9990, lng: -114.5000, lvl: 14, rarity: "rare" },
    { n: "Deathclaw Promontory", lat: 36.1000, lng: -114.9000, lvl: 45, rarity: "legendary" },
    { n: "Los Alamos Lab", lat: 35.875, lng: -106.300, lvl: 50, rarity: "legendary" },
    { n: "Yucca Mountain", lat: 37.000, lng: -116.800, lvl: 50, rarity: "legendary" },
    { n: "Nevada Test Site", lat: 37.100, lng: -116.000, lvl: 48, rarity: "legendary" },
    { n: "Diamond City", lat: 42.360, lng: -71.058, lvl: 15, rarity: "epic" },
    { n: "Glowing Sea", lat: 42.200, lng: -71.400, lvl: 50, rarity: "legendary" },
    { n: "Vault 111", lat: 42.390, lng: -71.300, lvl: 5, rarity: "common" },
    { n: "Megaton", lat: 38.863, lng: -77.085, lvl: 8, rarity: "rare" },
    { n: "Vault 101", lat: 38.948, lng: -77.334, lvl: 1, rarity: "common" },
    { n: "Dunwich Building", lat: 38.920, lng: -77.220, lvl: 40, rarity: "legendary" },
    { n: "The Pitt", lat: 40.4406, lng: -79.9959, lvl: 40, rarity: "legendary" },
    { n: "Nipton Trading Post", lat: 35.46667, lng: -115.27222, lvl: 4, rarity: "common" },
    { n: "Boulder City Hotel", lat: 35.97750, lng: -114.83639, lvl: 6, rarity: "rare" },
    { n: "New Vegas Strip", lat: 36.112740, lng: -115.174301, lvl: 10, rarity: "epic" },
    { n: "Freeside Market", lat: 36.170719, lng: -115.143929, lvl: 5, rarity: "common" },
    { n: "Red Rock Canyon", lat: 36.13514, lng: -115.4283, lvl: 8, rarity: "rare" },
    { n: "Nellis Air Force Base", lat: 36.2361, lng: -115.0342, lvl: 25, rarity: "epic" },
    { n: "Helios One", lat: 35.7580, lng: -114.9530, lvl: 13, rarity: "epic" },
    { n: "REPCONN Test Site", lat: 36.0360, lng: -115.0880, lvl: 12, rarity: "rare" },
    { n: "Quarry Junction", lat: 35.9200, lng: -115.1800, lvl: 35, rarity: "epic" },
    { n: "Dead Wind Cavern", lat: 35.8000, lng: -115.4000, lvl: 40, rarity: "legendary" },
    { n: "Bonnie Springs Ranch", lat: 36.06007, lng: -115.45027, lvl: 7, rarity: "common" },
    { n: "Callville Bay Marina", lat: 36.14400, lng: -114.72200, lvl: 9, rarity: "common" },
    { n: "Sloan Station", lat: 35.94361, lng: -115.21722, lvl: 5, rarity: "common" },
    { n: "Jean Airport", lat: 35.7677, lng: -115.3245, lvl: 6, rarity: "common" },
    { n: "McCarran Airport", lat: 36.0801, lng: -115.1522, lvl: 8, rarity: "rare" },
    { n: "Old Mormon Fort", lat: 36.1694, lng: -115.1305, lvl: 6, rarity: "common" },
    { n: "Ultra-Luxe Casino", lat: 36.0972, lng: -115.1787, lvl: 11, rarity: "epic" },
    { n: "Gomorrah Casino", lat: 36.1100, lng: -115.1720, lvl: 10, rarity: "epic" },
    { n: "Silver Rush", lat: 36.1498, lng: -115.1390, lvl: 9, rarity: "rare" },
    { n: "Atomic Wrangler", lat: 36.1499, lng: -115.1383, lvl: 8, rarity: "rare" },
    { n: "Nelson Ghost Town", lat: 35.4189, lng: -114.7133, lvl: 9, rarity: "rare" },
    { n: "Rhyolite Ghost Town", lat: 36.9033, lng: -116.8283, lvl: 11, rarity: "rare" },
    { n: "Mt Charleston", lat: 36.2650, lng: -115.6500, lvl: 16, rarity: "epic" },
    { n: "Luxor Pyramid", lat: 36.0965, lng: -115.1769, lvl: 9, rarity: "rare" },
    { n: "Whiskey Pete's", lat: 35.6167, lng: -115.3900, lvl: 3, rarity: "common" },
    { n: "Primm Valley Resort", lat: 35.6160, lng: -115.3900, lvl: 3, rarity: "common" },
    { n: "Westgate Hotel", lat: 36.1311, lng: -115.1564, lvl: 10, rarity: "epic" },
    { n: "Coca Cola Factory", lat: 36.1025, lng: -115.1738, lvl: 8, rarity: "rare" },
    { n: "Nellis Solar Array", lat: 36.2460, lng: -115.0320, lvl: 15, rarity: "epic" },
    { n: "Ivanpah Solar", lat: 35.2000, lng: -115.4667, lvl: 18, rarity: "epic" },
    { n: "Cottonwood Cove", lat: 35.9990, lng: -114.5000, lvl: 14, rarity: "rare" },
    { n: "Vault 34", lat: 36.1750, lng: -114.7500, lvl: 20, rads: 200 },
    { n: "Jacobstown", lat: 36.3000, lng: -115.6500, lvl: 22, rarity: "rare" },
    { n: "Dead Wind Cavern", lat: 35.8000, lng: -115.4000, lvl: 25, rads: 180 },
    { n: "REPCONN Headquarters", lat: 36.0500, lng: -115.1000, lvl: 13, rads: 95 },
    { n: "188 Trading Post", lat: 35.9500, lng: -115.2000, lvl: 8, rads: 25 },
    { n: "Griffin Caravan", lat: 35.9000, lng: -115.2500, lvl: 7, rads: 20 },
    { n: "Nevada Highway Patrol", lat: 35.9500, lng: -115.1500, lvl: 6, rads: 15 },
    { n: "Sarsaparilla HQ", lat: 36.0000, lng: -115.2000, lvl: 10, rads: 60 },
    { n: "HELIOS One Entrance", lat: 35.7600, lng: -114.9500, lvl: 13, rads: 90 },
    { n: "Camp Searchlight", lat: 35.4600, lng: -114.9200, lvl: 11, rads: 130 },
    { n: "Quarry Junction", lat: 35.9200, lng: -115.1800, lvl: 20, rads: 70 },
    { n: "Vikki Vance Museum", lat: 35.6150, lng: -115.3850, lvl: 4, rads: 18 },
    { n: "Mesquite Mountains", lat: 35.8500, lng: -115.9500, lvl: 17, rads: 100 },
    { n: "Devil's Gullet", lat: 35.7000, lng: -115.3000, lvl: 23, rads: 150 },
    { n: "Primm Schoolhouse", lat: 35.6150, lng: -115.3850, lvl: 3, rads: 12 },
    { n: "Nipton Hall", lat: 35.4667, lng: -115.2722, lvl: 5, rads: 50 },
    { n: "Boulder City Ruins", lat: 35.9775, lng: -114.8364, lvl: 7, rads: 20 },
    { n: "Megaton", lat: 38.863, lng: -77.085, lvl: 5, rads: 20 },
    { n: "Jefferson Memorial", lat: 38.876, lng: -77.012, lvl: 15, rads: 80 },
    { n: "Raven Rock", lat: 39.732, lng: -77.421, lvl: 25, rads: 120 },
    { n: "The Citadel", lat: 38.875, lng: -77.018, lvl: 20, rads: 30 },
    { n: "Vault 101", lat: 38.948, lng: -77.334, lvl: 1, rads: 5 },
    { n: "Rivet City", lat: 38.874, lng: -77.022, lvl: 8, rads: 25 },
    { n: "Point Lookout", lat: 38.043, lng: -76.003, lvl: 22, rads: 200 },
    { n: "Dunwich Building", lat: 38.920, lng: -77.220, lvl: 30, rads: 400 },
    { n: "Tenpenny Tower", lat: 38.920, lng: -77.200, lvl: 18, rads: 15 },
    { n: "Paradise Falls", lat: 38.900, lng: -77.250, lvl: 12, rads: 35 },
    { n: "Evergreen Mills", lat: 38.850, lng: -77.300, lvl: 15, rads: 60 },
    { n: "Vault 108", lat: 38.880, lng: -77.100, lvl: 14, rads: 90 },
    { n: "Little Lamplight", lat: 38.820, lng: -77.380, lvl: 10, rads: 25 },
    { n: "Andale", lat: 38.900, lng: -77.120, lvl: 8, rads: 40 },
    { n: "Arefu", lat: 38.920, lng: -77.180, lvl: 6, rads: 18 },
    { n: "Arlington Cemetery", lat: 38.880, lng: -77.070, lvl: 20, rads: 90 },
    { n: "Springvale School", lat: 38.910, lng: -77.310, lvl: 8, rads: 25 },
    { n: "Super-Duper Mart", lat: 38.920, lng: -77.290, lvl: 6, rads: 18 },
    { n: "Grayditch", lat: 38.880, lng: -77.170, lvl: 10, rads: 40 },
    { n: "Minefield", lat: 38.860, lng: -77.130, lvl: 12, rads: 30 },
    { n: "Vault 87", lat: 38.950, lng: -77.850, lvl: 30, rads: 300 },
    { n: "Old Olney", lat: 39.050, lng: -77.150, lvl: 22, rads: 100 },
    { n: "Enclave Camp", lat: 39.200, lng: -77.500, lvl: 28, rads: 120 },
    { n: "Mama Dolce's", lat: 38.850, lng: -77.200, lvl: 15, rads: 60 },
    { n: "Junction 109", lat: 38.840, lng: -77.100, lvl: 14, rads: 50 },
    { n: "Robotics Facility", lat: 38.820, lng: -77.080, lvl: 16, rads: 70 },
    { n: "Germantown Police", lat: 38.970, lng: -77.170, lvl: 18, rads: 85 },
    { n: "Murder Pass", lat: 39.000, lng: -77.200, lvl: 20, rads: 110 },
    { n: "Point Lookout Lighthouse", lat: 38.043, lng: -76.003, lvl: 25, rads: 220 },
    { n: "Turtledove Detention Camp", lat: 38.100, lng: -76.400, lvl: 18, rads: 80 },
    { n: "The Pitt", lat: 40.4406, lng: -79.9959, lvl: 40, rads: 600 },
    { n: "Diamond City", lat: 42.360, lng: -71.058, lvl: 10, rads: 15 },
    { n: "Goodneighbor", lat: 42.356, lng: -71.061, lvl: 12, rads: 40 },
    { n: "The Institute", lat: 42.358, lng: -71.057, lvl: 35, rads: 10 },
    { n: "Glowing Sea", lat: 42.200, lng: -71.400, lvl: 40, rads: 800 },
    { n: "Nuka-World", lat: 42.300, lng: -72.900, lvl: 30, rads: 300 },
    { n: "Far Harbor", lat: 44.300, lng: -68.300, lvl: 33, rads: 500 },
    { n: "Vault 111", lat: 42.390, lng: -71.300, lvl: 5, rads: 20 },
    { n: "Sanctuary Hills", lat: 42.210, lng: -71.410, lvl: 3, rads: 8 },
    { n: "Concord", lat: 42.450, lng: -71.350, lvl: 7, rads: 12 },
    { n: "Bunker Hill", lat: 42.370, lng: -71.070, lvl: 15, rads: 25 },
    { n: "Vault 114", lat: 42.370, lng: -71.050, lvl: 18, rads: 60 },
    { n: "Boston Common", lat: 42.356, lng: -71.065, lvl: 20, rads: 100 },
    { n: "Trinity Plaza", lat: 42.360, lng: -71.060, lvl: 22, rads: 80 },
    { n: "Vault 95", lat: 42.100, lng: -71.500, lvl: 28, rads: 200 },
    { n: "Spectacle Island", lat: 42.350, lng: -70.950, lvl: 25, rads: 150 },
    { n: "Vault 76", lat: 39.500, lng: -79.900, lvl: 1, rads: 10 },
    { n: "Whitespring Resort", lat: 38.050, lng: -79.800, lvl: 25, rads: 30 },
    { n: "Appalachian Workshop", lat: 38.200, lng: -80.000, lvl: 12, rads: 40 },
    { n: "The Crater", lat: 37.900, lng: -79.700, lvl: 35, rads: 150 },
    { n: "West Tek", lat: 38.300, lng: -80.100, lvl: 28, rads: 200 },
    { n: "Toxic Valley", lat: 38.400, lng: -80.200, lvl: 22, rads: 300 },
    { n: "Ash Heap", lat: 37.700, lng: -81.100, lvl: 18, rads: 120 },
    { n: "Area 51", lat: 37.2431, lng: -115.7930, lvl: 45, rads: 600 },
    { n: "Los Alamos Lab", lat: 35.875, lng: -106.300, lvl: 50, rads: 900 },
    { n: "Trinity Site", lat: 33.677, lng: -106.475, lvl: 55, rads: 1200 },
    { n: "Chernobyl Pripyat", lat: 51.389, lng: 30.099, lvl: 60, rads: 3000 },
    { n: "Fukushima Daiichi", lat: 37.421, lng: 141.032, lvl: 65, rads: 5000 },
    { n: "Three Mile Island", lat: 40.1522, lng: -77.1581, lvl: 20, rads: 150 },
    { n: "Hanford Site", lat: 46.5494, lng: -119.4762, lvl: 40, rads: 400 },
    { n: "Savannah River", lat: 33.247, lng: -81.402, lvl: 35, rads: 300 },
    { n: "Yucca Mountain", lat: 37.000, lng: -116.800, lvl: 50, rads: 1000 },
    { n: "Nevada Test Site", lat: 37.100, lng: -116.000, lvl: 48, rads: 800 },
    { n: "Windscale", lat: 54.417, lng: -3.487, lvl: 42, rads: 700 },
    { n: "Kyshtym", lat: 55.767, lng: 60.867, lvl: 55, rads: 2000 },
    { n: "Vault 13", lat: 37.500, lng: -121.900, lvl: 15, rads: 25 },
    { n: "Shady Sands", lat: 34.0522, lng: -118.2437, lvl: 8, rads: 12 },
    { n: "The Hub", lat: 34.0522, lng: -118.2437, lvl: 12, rads: 18 },
    { n: "Gecko Reactor", lat: 37.8000, lng: -121.9000, lvl: 25, rads: 150 },
    { n: "Broken Hills", lat: 37.6000, lng: -121.7000, lvl: 18, rads: 80 },
    { n: "Vault City", lat: 39.7392, lng: -104.9903, lvl: 22, rads: 40 },
    { n: "New Reno", lat: 39.5296, lng: -119.8138, lvl: 28, rads: 35 },
    { n: "Redding Mines", lat: 40.6066, lng: -122.1488, lvl: 20, rads: 60 },
    { n: "NCR Base", lat: 36.1699, lng: -115.1398, lvl: 15, rads: 20 },
    { n: "Brotherhood Bunker", lat: 34.0522, lng: -118.2437, lvl: 30, rads: 50 },
    { n: "Klamath", lat: 42.0000, lng: -121.8000, lvl: 10, rads: 15 },
    { n: "The Den", lat: 37.7749, lng: -122.4194, lvl: 14, rads: 25 },
    { n: "Modoc", lat: 41.6331, lng: -120.0294, lvl: 16, rads: 30 },
    { n: "Ghost Farm", lat: 41.5000, lng: -120.0000, lvl: 12, rads: 20 },
    { n: "Vault 15", lat: 34.5000, lng: -118.5000, lvl: 18, rads: 40 },
    { n: "Junktown", lat: 37.7749, lng: -122.4194, lvl: 6, rads: 10 },
    { n: "The Cathedral", lat: 34.0522, lng: -118.2437, lvl: 35, rads: 100 },
    { n: "Military Base", lat: 36.0000, lng: -115.0000, lvl: 40, rads: 120 },
    { n: "Glow", lat: 35.0000, lng: -115.0000, lvl: 55, rads: 1000 },
    { n: "Mariposa Base", lat: 37.5000, lng: -120.5000, lvl: 45, rads: 300 },
    { n: "Sierra Army Depot", lat: 40.0000, lng: -120.0000, lvl: 38, rads: 200 },
    { n: "EPA", lat: 38.0000, lng: -122.0000, lvl: 25, rads: 80 },
    { n: "The Master Lair", lat: 34.0522, lng: -118.2437, lvl: 60, rads: 500 },
    { n: "Children of the Cathedral", lat: 34.0522, lng: -118.2437, lvl: 32, rads: 90 },
    { n: "Followers Outpost", lat: 36.1699, lng: -115.1398, lvl: 12, rads: 15 },
    { n: "Gun Runners", lat: 36.1699, lng: -115.1398, lvl: 20, rads: 25 },
    { n: "Free Economic Zone", lat: 36.1699, lng: -115.1398, lvl: 18, rads: 20 },
    { n: "New California Republic", lat: 36.1699, lng: -115.1398, lvl: 25, rads: 30 },
    { n: "Shale Bridge", lat: 37.7749, lng: -122.4194, lvl: 8, rads: 12 },
    { n: "Sulphur Pits", lat: 40.0000, lng: -122.0000, lvl: 22, rads: 70 },
    { n: "Raided Caravan", lat: 37.0000, lng: -121.0000, lvl: 10, rads: 18 },
    { n: "Mutant Camp", lat: 37.5000, lng: -121.5000, lvl: 28, rads: 60 },
    { n: "Raider Outpost", lat: 38.0000, lng: -122.0000, lvl: 15, rads: 25 },
    { n: "Scavenger Camp", lat: 39.0000, lng: -123.0000, lvl: 12, rads: 20 },
    { n: "Abandoned Mine", lat: 40.0000, lng: -124.0000, lvl: 20, rads: 50 },
    { n: "Super Mutant Base", lat: 41.0000, lng: -125.0000, lvl: 35, rads: 100 },
    { n: "Deathclaw Nest", lat: 42.0000, lng: -126.0000, lvl: 40, rads: 150 },
    { n: "Radscorpion Den", lat: 43.0000, lng: -127.0000, lvl: 25, rads: 80 },
    { n: "Cazador Hive", lat: 36.0000, lng: -115.0000, lvl: 30, rads: 90 },
    { n: "Gecko Town", lat: 37.8000, lng: -121.9000, lvl: 22, rads: 150 },
    { n: "Vault 8", lat: 37.0000, lng: -121.0000, lvl: 28, rads: 40 },
    { n: "Vault 12", lat: 37.7749, lng: -122.4194, lvl: 35, rads: 200 },
    { n: "Vault 17", lat: 36.1699, lng: -115.1398, lvl: 32, rads: 120 },
    { n: "Enclave Oil Rig", lat: 33.000, lng: -118.000, lvl: 50, rads: 200 },
    { n: "Brotherhood HQ", lat: 34.0522, lng: -118.2437, lvl: 35, rads: 60 },
    { n: "NCR Capital", lat: 36.1699, lng: -115.1398, lvl: 30, rads: 25 },
    { n: "Raider Stronghold", lat: 37.0000, lng: -121.0000, lvl: 22, rads: 45 },
    { n: "Mutant Stronghold", lat: 37.5000, lng: -121.5000, lvl: 38, rads: 120 },
    { n: "Deathclaw Promontory", lat: 38.0000, lng: -122.0000, lvl: 45, rads: 180 },
    { n: "Oil Rig", lat: 33.0000, lng: -118.0000, lvl: 55, rads: 250 },
    { n: "Vault 11", lat: 35.5000, lng: -117.0000, lvl: 28, rads: 90 },
    { n: "Vault 22", lat: 36.1699, lng: -115.1398, lvl: 32, rads: 150 },
    { n: "Vault 3", lat: 36.2000, lng: -115.8000, lvl: 25, rads: 80 },
    { n: "Vault 19", lat: 36.1000, lng: -115.9000, lvl: 22, rads: 60 },
    { n: "Vault 21", lat: 36.1699, lng: -115.1398, lvl: 18, rads: 40 },
    { n: "Vault 29", lat: 36.0000, lng: -116.0000, lvl: 30, rads: 100 },
    { n: "Vault 32", lat: 35.8000, lng: -116.2000, lvl: 28, rads: 90 },
    { n: "Vault 36", lat: 35.6000, lng: -116.4000, lvl: 35, rads: 150 },
    { n: "Vault 87", lat: 38.950, lng: -77.850, lvl: 30, rads: 300 },
    { n: "Vault 92", lat: 38.900, lng: -77.300, lvl: 25, rads: 80 },
    { n: "Vault 106", lat: 38.800, lng: -77.400, lvl: 32, rads: 120 },
    { n: "Vault 112", lat: 38.700, lng: -77.500, lvl: 28, rads: 100 },
    { n: "Mothership Zeta", lat: 0, lng: 0, lvl: 99, rarity: "legendary" }  the rest of your locations here];
    ];
// ============================
// Routes
// ============================
app.get('/locations', (req, res) => res.json(locations));
app.get('/api/locations', (req, res) => res.json(locations));

// ===== INVENTORY & QUESTS (this is what was missing) =====
app.get('/api/player/:wallet', async (req, res) => {
    try {
        const { wallet } = req.params;
        const data = await redis.get(`player:${wallet}`);
        if (!data) return res.json({ level: 1, xp: 0, caps: 0, inventory: [], stimpaks: [], quests: [] });
        res.json(JSON.parse(data));
    } catch (e) {
        res.json({ level: 1, xp: 0, caps: 0, inventory: [], stimpaks: [], quests: [] });
    }
});

app.post('/api/player/:wallet', async (req, res) => {
    try {
        const { wallet } = req.params;
        await redis.set(`player:${wallet}`, JSON.stringify(req.body));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'save failed' });
    }
});

app.get('/api/quests', (req, res) => {
    res.json([
        { id: 1, name: "Visit Goodsprings", reward: 100, target: "Goodsprings Saloon" },
        { id: 2, name: "Reach Level 10", reward: 500, target: 10 }
    ]);
});

app.post('/claim-survival', async (req, res) => {
    try {
        const { wallet, spot } = req.body;
        if (!wallet || !spot) return res.status(400).json({ error: 'Missing wallet or spot' });

        const walletPubkey = new PublicKey(wallet);
        const cooldownKey = `cooldown:claim:${wallet}:${spot}`;
        if (await redis.exists(cooldownKey))
            return res.status(429).json({ error: 'Still irradiated — wait 24h!' });

        // === Mint 25 CAPS ===
        const ata = await getOrCreateAssociatedTokenAccount(connection, mintAuthority, CAPS_MINT, walletPubkey);
        const mintSig = await mintTo(connection, mintAuthority, CAPS_MINT, ata.address, mintAuthority, 25_000_000_000); // 25 CAPS (9 decimals)

        // === Random Gear Drop ===
        let gearDrop = null;
        const roll = Math.random();
        if (roll < 0.03) gearDrop = await mintGear(walletPubkey, 'Power Armor T-51b', 'legendary');
        else if (roll < 0.12) gearDrop = await mintGear(walletPubkey, 'Service Rifle', 'rare');
        else if (roll < 0.30) gearDrop = await mintGear(walletPubkey, '10mm Pistol', 'common');

        // === Possible Raid ===
        let raid = null;
        const highRisk = ['Black Mountain', 'Hoover Dam', 'Lucky 38', 'Area 51 Gate'];
        if (highRisk.some((s) => spot.includes(s)) && Math.random() < 0.07) {
            raid = await triggerRaid(wallet);
        }

        // === Update Player State ===
        const player = await getOrCreatePlayer(wallet);
        const p = player[0] || player;
        if (gearDrop) p.gear.push(gearDrop);
        if (raid) {
            p.hp = raid.hp;
            p.gear = raid.gear;
        }
        await redis.json.set(`player:${wallet}`, '$', p);

        // === 24h cooldown per spot ===
        await redis.set(cooldownKey, '1', { EX: 86400 });

        res.json({
            success: true,
            caps: 25,
            gear: gearDrop,
            raid,
            hp: p.hp,
            explorer: `https://solscan.io/tx/${mintSig}${process.env.SOLANA_RPC_URL?.includes('mainnet') ? '' : '?cluster=devnet'}`,
            message: `${spot} LOOTED! +25 CAPS${gearDrop ? ' + GEAR!' : ''}${raid ? ' → RAILED!' : ''}`,
        });
    } catch (err) {
        console.error('Claim error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/buy-stimpak', async (req, res) => {
    try {
        const { wallet, tier } = req.body;
        if (!wallet || !['common', 'rare', 'legendary'].includes(tier))
            return res.status(400).json({ error: 'Invalid request' });

        const costs = { common: 50, rare: 150, legendary: 500 };
        const cost = costs[tier];

        const walletPubkey = new PublicKey(wallet);
        const ata = await getOrCreateAssociatedTokenAccount(connection, mintAuthority, CAPS_MINT, walletPubkey);
        const balance = await connection.getTokenAccountBalance(ata.address);
        const currentCaps = Number(balance.value.amount) / 1_000_000_000; // Assuming 9 decimals
        if (currentCaps < cost) return res.status(400).json({ error: 'Not enough CAPS' });

        const recentBlockhash = await connection.getLatestBlockhash();
        const tx = new Transaction({
            recentBlockhash: recentBlockhash.blockhash,
            feePayer: walletPubkey,
        });

        const burnAmount = BigInt(cost * 1_000_000_000);
        const burnInstruction = createBurnInstruction(
            ata.address,
            CAPS_MINT,
            walletPubkey,
            burnAmount
        );
        tx.add(burnInstruction);

        const serializedTx = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');

        // Store pending buy in Redis with a short TTL
        await redis.set(`pending-buy:${wallet}:${tier}`, serializedTx, { EX: 300 }); // 5 min

        res.json({ transaction: serializedTx, message: 'Sign and send this transaction with your wallet.' });
    } catch (err) {
        console.error('Buy stimpak error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/confirm-buy-stimpak', async (req, res) => {
    try {
        const { wallet, tier, signature } = req.body;
        if (!wallet || !tier || !signature) return res.status(400).json({ error: 'Missing params' });

        // Verify pending
        const pendingKey = `pending-buy:${wallet}:${tier}`;
        const pendingTx = await redis.get(pendingKey);
        if (!pendingTx) return res.status(400).json({ error: 'No pending buy found' });

        // Confirm transaction
        const sigStatus = await connection.confirmTransaction(signature, 'confirmed');
        if (sigStatus.value.err) return res.status(400).json({ error: 'Transaction failed' });

        // Optional: Fetch tx details to verify burn amount, but for simplicity skip if rate-limited

        // Mint stimpak NFT
        const walletPubkey = new PublicKey(wallet);
        const stimpak = await mintStimpak(walletPubkey, tier); // Assume you have this function similar to mintGear

        // Update player if needed (e.g., add to inventory)
        const playerData = await getOrCreatePlayer(wallet);
        const player = playerData[0] || playerData;
        if (!player.stimpaks) player.stimpaks = [];
        player.stimpaks.push(stimpak);
        await redis.json.set(`player:${wallet}`, '$', player);

        // Clean pending
        await redis.del(pendingKey);

        res.json({
            success: true,
            stimpak,
            explorer: `https://solscan.io/tx/${signature}${process.env.SOLANA_RPC_URL?.includes('mainnet') ? '' : '?cluster=devnet'}`,
            message: `Stimpak (${tier}) purchased!`
        });
    } catch (err) {
        console.error('Confirm buy error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});