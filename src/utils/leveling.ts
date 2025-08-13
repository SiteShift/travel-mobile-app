import AsyncStorage from '@react-native-async-storage/async-storage';

export type LevelingState = {
	xp: number;
};

const STORAGE_KEY = 'leveling_v1_state';
const XP_PER_LEVEL = 100; // simple linear curve: every 100 XP → next level

export const computeLevelFromXp = (xp: number): number => {
	if (!Number.isFinite(xp) || xp <= 0) return 1;
	return Math.floor(xp / XP_PER_LEVEL) + 1;
};

export const xpToNextLevel = (xp: number): { currentLevel: number; currentLevelXp: number; nextLevelXp: number; remaining: number } => {
	const level = computeLevelFromXp(xp);
	const currentLevelXp = (level - 1) * XP_PER_LEVEL;
	const nextLevelXp = level * XP_PER_LEVEL;
	return { currentLevel: level, currentLevelXp, nextLevelXp, remaining: Math.max(0, nextLevelXp - xp) };
};

export async function getLevelingState(): Promise<LevelingState> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY);
		if (!raw) return { xp: 0 };
		const parsed = JSON.parse(raw);
		const xp = Number(parsed?.xp) || 0;
		return { xp };
	} catch {
		return { xp: 0 };
	}
}

async function setLevelingState(next: LevelingState): Promise<void> {
	try {
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	} catch {}
}

export async function addXp(amount: number): Promise<LevelingState> {
	if (!Number.isFinite(amount) || amount === 0) return getLevelingState();
	const current = await getLevelingState();
	const next = { xp: Math.max(0, current.xp + amount) };
	await setLevelingState(next);
	return next;
}

// Convenience helpers for app actions
export async function awardTripCreated(): Promise<LevelingState> {
	return addXp(50);
}

export async function awardPhotosAdded(count: number): Promise<LevelingState> {
	const n = Math.max(0, Math.floor(count));
	if (n === 0) return getLevelingState();
	return addXp(n); // +1 XP per image
}

// Missions (minimal scaffold for future expansion)
export type Mission = {
	id: string;
	title: string;
	rewardXp: number;
	maxProgress: number;
	progress: number;
};

const MISSIONS_KEY = 'missions_v1_state';

export async function getMissions(): Promise<Mission[]> {
	try {
		const raw = await AsyncStorage.getItem(MISSIONS_KEY);
		// default missions
		const defaults: Mission[] = [
			{ id: 'share_app', title: 'Share the app', rewardXp: 100, maxProgress: 1, progress: 0 },
			{ id: 'add_3_trips', title: 'Create 3 trips', rewardXp: 150, maxProgress: 3, progress: 0 },
			{ id: 'first_trip', title: 'Create your first trip', rewardXp: 50, maxProgress: 1, progress: 0 },
			{ id: 'add_10_photos', title: 'Add 10 photos', rewardXp: 30, maxProgress: 10, progress: 0 },
			{ id: 'add_20_photos', title: 'Add 20 photos', rewardXp: 60, maxProgress: 20, progress: 0 },
			{ id: 'add_50_photos', title: 'Add 50 photos', rewardXp: 120, maxProgress: 50, progress: 0 },
			{ id: 'reach_level_3', title: 'Reach Level 3', rewardXp: 200, maxProgress: 1, progress: 0 },
			{ id: 'first_caption', title: 'Add your first caption', rewardXp: 20, maxProgress: 1, progress: 0 },
			{ id: 'weekly_login', title: 'Open the app 7 days in a row', rewardXp: 70, maxProgress: 7, progress: 0 },
			{ id: 'add_profile_picture', title: 'Add a profile picture', rewardXp: 40, maxProgress: 1, progress: 0 },
		];
		const removedIds = new Set<string>(['map_explorer', 'entry_writer', 'gallery_curator']);
		if (!raw) {
			await AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify(defaults));
			return defaults;
		}
		const existing: Mission[] = JSON.parse(raw);
		// Merge in any new defaults that aren't present yet
		const existingIds = new Set(existing.map(m => m.id));
		const merged = [...existing];
		for (const d of defaults) {
			if (!existingIds.has(d.id)) merged.push(d);
		}
		// Remove deprecated missions if present
		const cleaned = merged.filter(m => !removedIds.has(m.id));
		await AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify(cleaned));
		return cleaned;
	} catch {
		return [];
	}
}

export async function progressMission(id: string, delta: number = 1): Promise<Mission[] | null> {
	try {
		const list = await getMissions();
		const idx = list.findIndex(m => m.id === id);
		if (idx < 0) return list;
		const target = list[idx];
		const nextProgress = Math.min(target.maxProgress, Math.max(0, target.progress + delta));
		list[idx] = { ...target, progress: nextProgress };
		await AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify(list));
		if (target.progress < target.maxProgress && nextProgress >= target.maxProgress) {
			// mission completed → grant XP
			await addXp(target.rewardXp);
		}
		return list;
	} catch {
		return null;
	}
}

export async function resetLeveling(): Promise<void> {
	try {
		await AsyncStorage.multiRemove([STORAGE_KEY, MISSIONS_KEY]);
	} catch {}
}


