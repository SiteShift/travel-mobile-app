import AsyncStorage from '@react-native-async-storage/async-storage';

export type LevelingState = {
	xp: number;
};

const STORAGE_KEY = 'leveling_v1_state';
export const TOTAL_XP = 10000; // Total XP available across all missions
export const MAX_LEVEL = 10;
const PENDING_LEVELUP_KEY = 'pending_levelup_v1';

// Progressive level thresholds (cumulative XP required to reach each level)
// Option B: strictly increasing spans up to L9; preserve L8=5000, L9=8000; L10 final=10000
// Levels min XP: [0, 200, 500, 1000, 1600, 2400, 3400, 5000, 8000, 10000]
// Resulting spans: [200, 300, 500, 600, 800, 1000, 1600, 3000, 2000]
const LEVEL_THRESHOLDS: number[] = [0, 200, 500, 1000, 1600, 2400, 3400, 5000, 8000, TOTAL_XP];

export const computeLevelFromXp = (xp: number): number => {
    const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
        if (safeXp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
    }
    return Math.max(1, Math.min(MAX_LEVEL, level));
};

export const xpToNextLevel = (xp: number): { currentLevel: number; currentLevelXp: number; nextLevelXp: number; remaining: number } => {
    const level = computeLevelFromXp(xp);
    const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelXp = level >= MAX_LEVEL ? LEVEL_THRESHOLDS[MAX_LEVEL - 1] : LEVEL_THRESHOLDS[level];
    const remaining = level >= MAX_LEVEL ? 0 : Math.max(0, nextLevelXp - Math.max(0, xp));
    return { currentLevel: level, currentLevelXp, nextLevelXp, remaining };
};

// XP span required to complete a given level
export const xpSpanForLevel = (level: number): number => {
  const lv = Number.isFinite(level) ? Math.max(1, Math.min(MAX_LEVEL, Math.floor(level))) : 1;
  if (lv < MAX_LEVEL) {
    return (LEVEL_THRESHOLDS[lv] ?? 0) - (LEVEL_THRESHOLDS[lv - 1] ?? 0);
  }
  // Level 10 is max level → no further progression span
  return 0;
};

// Cumulative thresholds helpers
export const getMinXpForLevel = (level: number): number => {
  const lv = Number.isFinite(level) ? Math.max(1, Math.min(MAX_LEVEL, Math.floor(level))) : 1;
  return LEVEL_THRESHOLDS[lv - 1] ?? 0;
};

export const getXpTargetForLevel = (level: number): number => {
  const lv = Number.isFinite(level) ? Math.max(1, Math.min(MAX_LEVEL, Math.floor(level))) : 1;
  if (lv >= MAX_LEVEL) return TOTAL_XP;
  return LEVEL_THRESHOLDS[lv] ?? TOTAL_XP;
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
	const prevLevel = computeLevelFromXp(current.xp || 0);
	const next = { xp: Math.max(0, current.xp + amount) };
	await setLevelingState(next);
	// If user crossed a level boundary, set a pending level-up flag for next app focus
	try {
		const newLevel = computeLevelFromXp(next.xp || 0);
		if (newLevel > prevLevel) {
			await AsyncStorage.setItem(PENDING_LEVELUP_KEY, JSON.stringify({ level: newLevel, createdAt: Date.now() }));
		}
	} catch {}
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

// Target total XP across all ladders + one-offs should be 10,000.
// One-offs sum to 220, so ladders total to 9,780. Allocate per ladder below.
const LADDER_TOTALS: Record<string, number> = {
	create_trips: 1760,
	add_photos: 1960,
	add_captions: 1760,
	open_streak: 390,
	visit_countries: 2540,
	achieve_level: 1370,
};

function buildProgressiveRewards(thresholds: number[], total: number): Record<number, number> {
	// Progressive weighting by stage index (1..k) to give more XP later
	// Use exponent > 1 for progression; tune to produce smooth growth
	const exponent = 1.4;
	const weights: number[] = thresholds.map((_, i) => Math.pow(i + 1, exponent));
	const weightSum = weights.reduce((a, b) => a + b, 0);
	const rawRewards = weights.map(w => (w / (weightSum || 1)) * Math.max(0, total));
	const rounded = rawRewards.map(v => Math.max(1, Math.round(v)));
	let diff = Math.max(0, total - rounded.reduce((a, b) => a + b, 0));
	// Distribute any remainder to later stages to preserve progression
	for (let i = rounded.length - 1; i >= 0 && diff > 0; i -= 1) {
		rounded[i] += 1;
		diff -= 1;
	}
	// If we overshot due to rounding, subtract from earliest stages
	let overshoot = Math.max(0, rounded.reduce((a, b) => a + b, 0) - Math.max(0, total));
	for (let i = 0; i < rounded.length && overshoot > 0; i += 1) {
		const take = Math.min(overshoot, Math.max(0, rounded[i] - 1));
		rounded[i] -= take;
		overshoot -= take;
	}
	const map: Record<number, number> = Object.create(null);
	thresholds.forEach((t, i) => { map[t] = rounded[i]; });
	return map;
}

// Precompute progressive reward maps for each ladder
const REWARD_MAPS: Record<string, Record<number, number>> = Object.create(null);

const LADDERS: Record<string, LadderDef> = {
	// Create Trips ladder
	create_trips: {
    // Match available badge images: 1,2,3,5,10,15,20,25,30,40,50
    thresholds: [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50],
		titleFor: (n) => `Create ${n} trip${n > 1 ? 's' : ''}`,
		rewardFor: (n) => {
			if (!REWARD_MAPS.create_trips) {
				REWARD_MAPS.create_trips = buildProgressiveRewards(LADDERS.create_trips.thresholds, LADDER_TOTALS.create_trips);
			}
			return REWARD_MAPS.create_trips[n] ?? 1;
		},
	},
	// Add Photos ladder
	add_photos: {
    thresholds: [5, 10, 25, 50, 100, 250, 500, 1000],
		titleFor: (n) => `Add ${n} photo${n > 1 ? 's' : ''}`,
		rewardFor: (n) => {
			if (!REWARD_MAPS.add_photos) {
				REWARD_MAPS.add_photos = buildProgressiveRewards(LADDERS.add_photos.thresholds, LADDER_TOTALS.add_photos);
			}
			return REWARD_MAPS.add_photos[n] ?? 1;
		},
	},
	// Add Captions ladder
	add_captions: {
    thresholds: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
		titleFor: (n) => `Add ${n} caption${n > 1 ? 's' : ''}`,
		rewardFor: (n) => {
			if (!REWARD_MAPS.add_captions) {
				REWARD_MAPS.add_captions = buildProgressiveRewards(LADDERS.add_captions.thresholds, LADDER_TOTALS.add_captions);
			}
			return REWARD_MAPS.add_captions[n] ?? 1;
		},
	},
	// Open app streak ladder
	open_streak: {
    thresholds: [3, 5, 7, 10, 30],
		titleFor: (n) => `${n} Day Streak`,
		rewardFor: (n) => {
			if (!REWARD_MAPS.open_streak) {
				REWARD_MAPS.open_streak = buildProgressiveRewards(LADDERS.open_streak.thresholds, LADDER_TOTALS.open_streak);
			}
			return REWARD_MAPS.open_streak[n] ?? 1;
		},
	},
	// Visit Countries ladder
	visit_countries: {
    thresholds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 25, 50, 100],
		titleFor: (n) => `Visit ${n} countr${n === 1 ? 'y' : 'ies'}`,
		rewardFor: (n) => {
			if (!REWARD_MAPS.visit_countries) {
				REWARD_MAPS.visit_countries = buildProgressiveRewards(LADDERS.visit_countries.thresholds, LADDER_TOTALS.visit_countries);
			}
			return REWARD_MAPS.visit_countries[n] ?? 1;
		},
	},
  // Achieve Level ladder (levels 2 → 10)
  achieve_level: {
    thresholds: [2, 3, 4, 5, 6, 7, 8, 9, 10],
		titleFor: (n) => `Achieve Level ${n}`,
		rewardFor: (n) => {
			if (!REWARD_MAPS.achieve_level) {
				REWARD_MAPS.achieve_level = buildProgressiveRewards(LADDERS.achieve_level.thresholds, LADDER_TOTALS.achieve_level);
			}
			return REWARD_MAPS.achieve_level[n] ?? 1;
		},
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

          // Photos: prefer fast totalPhotos if present, else sum from days
          if (typeof t?.totalPhotos === 'number') {
            photoCount += t.totalPhotos;
          } else if (Array.isArray(t?.days)) {
            for (const d of t.days) {
              const mems = Array.isArray(d?.memories) ? d.memories : [];
              photoCount += mems.length;
            }
          }

          // Captions: always scan days if present, even when totalPhotos is present
          if (Array.isArray(t?.days)) {
            for (const d of t.days) {
              const mems = Array.isArray(d?.memories) ? d.memories : [];
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
  const levelState = await getLevelingState();
  const { currentLevel } = xpToNextLevel(levelState.xp || 0);
	const metrics: Record<string, number> = {
		create_trips: stats.tripCount,
		add_photos: stats.photoCount,
		add_captions: stats.captionCount,
		open_streak: stats.currentStreak,
		visit_countries: stats.countryCount,
    achieve_level: currentLevel,
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
    // Load current level for level-based ladder metrics
    const levelState = await getLevelingState();
    const { currentLevel } = xpToNextLevel(levelState.xp || 0);
    // Load existing missions to preserve one-off mission progress
    let existing: Mission[] = [];
    try {
      const rawExisting = await AsyncStorage.getItem(MISSIONS_KEY);
      existing = rawExisting ? JSON.parse(rawExisting) : [];
    } catch {}
    const existingProgress: Record<string, number> = Object.create(null);
    for (const m of existing) {
      if (m && typeof m.id === 'string') {
        existingProgress[m.id] = Number(m.progress) || 0;
      }
    }
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
        : key === 'achieve_level' ? currentLevel
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
      { id: 'share_app', title: 'Share the app', rewardXp: 100, maxProgress: 1, progress: existingProgress['share_app'] ?? 0 },
      { id: 'add_profile_picture', title: 'Add a profile picture', rewardXp: 40, maxProgress: 1, progress: existingProgress['add_profile_picture'] ?? 0 },
      { id: 'play_trippin', title: 'Play Trippin', rewardXp: 80, maxProgress: 1, progress: existingProgress['play_trippin'] ?? 0 },
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
		await AsyncStorage.multiRemove([STORAGE_KEY, MISSIONS_KEY, PENDING_LEVELUP_KEY]);
	} catch {}
}

// Pending level-up helpers
export async function getPendingLevelup(): Promise<number | null> {
	try {
		const raw = await AsyncStorage.getItem(PENDING_LEVELUP_KEY);
		if (!raw) return null;
		const obj = JSON.parse(raw);
		const lvl = Number(obj?.level);
		return Number.isFinite(lvl) && lvl >= 1 && lvl <= MAX_LEVEL ? lvl : null;
	} catch {
		return null;
	}
}

export async function clearPendingLevelup(): Promise<void> {
	try { await AsyncStorage.removeItem(PENDING_LEVELUP_KEY); } catch {}
}


