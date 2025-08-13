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

const MISSIONS_KEY = 'missions_v2_state';
const MISSION_STAGES_KEY = 'mission_stages_v1';
const STREAK_KEY = 'app_streak_v1';

type MissionStageState = { stageIndex: number };
type MissionStagesMap = Record<string, MissionStageState>;

type LadderDef = {
	thresholds: number[];
	titleFor: (n: number) => string;
	rewardFor: (n: number) => number; // reward XP for completing this threshold
};

const LADDERS: Record<string, LadderDef> = {
	// Create Trips ladder
	create_trips: {
		thresholds: [1, 2, 3, 5, 10, 15, 20, 25, 50, 100],
		titleFor: (n) => `Create ${n} trip${n > 1 ? 's' : ''}`,
		rewardFor: (n) => 25 * n,
	},
	// Add Photos ladder
	add_photos: {
		thresholds: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
		titleFor: (n) => `Add ${n} photo${n > 1 ? 's' : ''}`,
		rewardFor: (n) => 1 * n,
	},
	// Add Captions ladder
	add_captions: {
		thresholds: [1, 5, 10, 25, 50, 100],
		titleFor: (n) => `Add ${n} caption${n > 1 ? 's' : ''}`,
		rewardFor: (n) => 2 * n,
	},
	// Open app streak ladder
	open_streak: {
		thresholds: [1, 3, 5, 7, 10, 20, 30],
		titleFor: (n) => `Open the app ${n} day${n > 1 ? 's' : ''} in a row` ,
		rewardFor: (n) => 10 * n,
	},
	// Visit Countries ladder
	visit_countries: {
		thresholds: [1, 2, 3, 4, 5, 6, 7, 35, 40, 45, 50, 100],
		titleFor: (n) => `Visit ${n} countr${n === 1 ? 'y' : 'ies'}`,
		rewardFor: (n) => 20 * n,
	},
};

async function getMissionStages(): Promise<MissionStagesMap> {
	try {
		const raw = await AsyncStorage.getItem(MISSION_STAGES_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

async function setMissionStages(next: MissionStagesMap): Promise<void> {
	try {
		await AsyncStorage.setItem(MISSION_STAGES_KEY, JSON.stringify(next));
	} catch {}
}

// Daily streak tick; call once per app open/focus
export async function tickDailyStreak(): Promise<{ current: number; best: number }>{
	try {
		const today = new Date();
		const ymd = today.toISOString().slice(0, 10);
		const raw = await AsyncStorage.getItem(STREAK_KEY);
		let current = 0;
		let best = 0;
		let last = '';
		if (raw) {
			try { ({ current, best, last } = JSON.parse(raw)); } catch {}
		}
		if (last === ymd) {
			// already counted today
			return { current, best };
		}
		let nextCurrent = 1;
		if (last) {
			const prev = new Date(last + 'T00:00:00');
			const diffDays = Math.floor((today.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
			nextCurrent = diffDays === 1 ? current + 1 : 1;
		}
		const nextBest = Math.max(best || 0, nextCurrent);
		await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ current: nextCurrent, best: nextBest, last: ymd }));
		return { current: nextCurrent, best: nextBest };
	} catch {
		return { current: 0, best: 0 };
	}
}

async function computeAppStats(): Promise<{
	tripCount: number;
	photoCount: number;
	captionCount: number;
	countryCount: number;
	currentStreak: number;
}> {
	try {
		const keys = await AsyncStorage.getAllKeys();
		const tripKeys = keys.filter(k => k.startsWith('trip_'));
		let tripCount = 0;
		let photoCount = 0;
		let captionCount = 0;
		const countries = new Set<string>();
		if (tripKeys.length) {
			const pairs = await AsyncStorage.multiGet(tripKeys);
			for (const [, v] of pairs) {
				if (!v) continue;
				try {
					const t = JSON.parse(v);
					if (t?.id && t?.title) tripCount += 1;
					if (typeof t?.country === 'string' && t.country.trim()) countries.add(String(t.country).trim());
					if (typeof t?.totalPhotos === 'number') {
						photoCount += t.totalPhotos;
					} else if (Array.isArray(t?.days)) {
						for (const d of t.days) {
							const mems = Array.isArray(d?.memories) ? d.memories : [];
							photoCount += mems.length;
							captionCount += mems.reduce((acc: number, m: any) => acc + (m?.caption && String(m.caption).trim() ? 1 : 0), 0);
						}
					}
				} catch {}
			}
		}
		let currentStreak = 0;
		try {
			const raw = await AsyncStorage.getItem(STREAK_KEY);
			if (raw) {
				const s = JSON.parse(raw);
				currentStreak = Number(s?.current) || 0;
			}
		} catch {}
		return { tripCount, photoCount, captionCount, countryCount: countries.size, currentStreak };
	} catch {
		return { tripCount: 0, photoCount: 0, captionCount: 0, countryCount: 0, currentStreak: 0 };
	}
}

// Advance ladder stages based on current computed stats; grants XP on each stage completion.
export async function updateMissionLadders(): Promise<void> {
	const stages = await getMissionStages();
	const stats = await computeAppStats();
	const metrics: Record<string, number> = {
		create_trips: stats.tripCount,
		add_photos: stats.photoCount,
		add_captions: stats.captionCount,
		open_streak: stats.currentStreak,
		visit_countries: stats.countryCount,
	};
	let changed = false;
	for (const key of Object.keys(LADDERS)) {
		const def = LADDERS[key];
		const currentStage = stages[key]?.stageIndex ?? 0;
		let idx = currentStage;
		let metric = metrics[key] || 0;
		// Advance multiple stages if metric already exceeds several thresholds
  while (idx < def.thresholds.length && metric >= def.thresholds[idx]) {
    // Award XP only when crossing into a new stage beyond the previously stored one
    if (idx > (stages[key]?.stageIndex ?? 0)) {
      await addXp(def.rewardFor(def.thresholds[idx]));
    }
    idx += 1;
  }
		const nextIdx = Math.min(idx, def.thresholds.length - 1);
		if ((stages[key]?.stageIndex ?? 0) !== nextIdx) {
			stages[key] = { stageIndex: nextIdx };
			changed = true;
		} else if (!stages[key]) {
			stages[key] = { stageIndex: nextIdx };
			changed = true;
		}
	}
	if (changed) await setMissionStages(stages);
}

export async function getMissions(): Promise<Mission[]> {
	try {
		// Always update streak on mission read
		await tickDailyStreak();
		// Ensure ladders are advanced to current stats
		await updateMissionLadders();
		const stages = await getMissionStages();
		const stats = await computeAppStats();
		const missions: Mission[] = [];
		// Build ladder missions (one per ladder, at current stage)
		for (const key of Object.keys(LADDERS)) {
			const def = LADDERS[key];
			const stage = Math.min(stages[key]?.stageIndex ?? 0, def.thresholds.length - 1);
			const target = def.thresholds[stage];
			const metric = key === 'create_trips' ? stats.tripCount
				: key === 'add_photos' ? stats.photoCount
				: key === 'add_captions' ? stats.captionCount
				: key === 'open_streak' ? stats.currentStreak
				: key === 'visit_countries' ? stats.countryCount
				: 0;
			missions.push({
				id: `ladder_${key}`,
				title: def.titleFor(target),
				rewardXp: def.rewardFor(target),
				maxProgress: target,
				progress: Math.min(target, metric),
			});
		}
		// Include simple, one-off missions
		missions.push(
			{ id: 'share_app', title: 'Share the app', rewardXp: 100, maxProgress: 1, progress: 0 },
			{ id: 'add_profile_picture', title: 'Add a profile picture', rewardXp: 40, maxProgress: 1, progress: 0 },
		);
		await AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
		return missions;
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


