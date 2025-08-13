Final MVP Checklist 


[DONE] Make the trip image on the home page to look like a 3d book with spine
[DONE] Make book animation to use the same blank book template

[DONE] After creating a trip (in the book animation flow), show a celebration / dopamine-hit moment

[DONE] Level top right on home page needs work. Level 1 with badge on the left

[DONE]  Levelling lightbox - make dotted horizontal line more transparent. Also make it like '-•-•-•-'

[Partially Done] Develop the levelling system - Add Trip +50 points, +1 point per image, Replace achievemnets in profile page to be missions where when you complete it you get more points, like +100 share the app, add 3 trips, etc.

[ ] 'i' on level lightbox to open another lightbox explaining the levelling system

[Partially Done] Optimise the 3D carosel as the more trips you add the app gets very laggy. LOG  VirtualizedList: You have a large list that is slow to update - make sure your renderItem function renders components that follow React performance best practices like PureComponent, shouldComponentUpdate, etc. {"contentLength": 2656.666748046875, "dt": 1706, "prevDt": 8775}

[ ] When you level up - next time you go to home page the level lightbox opens up and there is a slow reveal of the new level badge and some other animations - dopamine hit

[x] optimise the level lightbox to load quicker
  ✅ Implemented 2025-08-13: Optimized `LevelLightbox` with native-driven scroll, stricter FlatList virtualization (initialNumToRender=1, windowSize=3, maxToRenderPerBatch=2, removeClippedSubviews), `initialScrollIndex` for instant positioning, and `expo-image` tuning (recyclingKey, allowDownscaling, priority, cachePolicy). Result: noticeably faster open and swiping with lower memory use; no visual or functional changes.

[ ] Add 'Location' in create trip page so user can add where they are going. This can be mapped in profile page to count towards 'Countries' and can add mission 'Go to 5 Countries' etc.

[x] Change dark mode to be dark grey instead of dark blue. Make sure all text, elements etc work on dark mode.
  ✅ Implemented 2025-08-13: Updated dark theme to neutral greys in `src/constants/theme.ts` (background.primary=#121212, secondary=#1a1a1a, tertiary=#222222; surfaces to matching greys; text/border tuned for contrast). Components use `useTheme()` colors, so visuals update automatically. Status bar remains light-content in dark mode via `SafeAreaWrapper`.

[DONE] On the profile page make profile picture changable so user can change it to whatevr they want

[ ] XP/progress bar on profile needs to be synced with their level. Also on the left bar put the image of their current level, on the right add the image of their next level

[ ] On home page when you click ellipse to edit cover or delete trip - they should be able to edit title and description and cover. Change edit cover to be 'Edit Trip' and it lets them change image, title and description. Also add a share trip so they can share their trip which will get more people to download the app

[ ] The app needs to do permissions when first opening? We are going to do an onboarding eventually but we need to handle permissions so user can take photos, but more importantly so when they create trip it can use their location so it can pin pointed on the map

[DONE] Add light and dark toggle to the profile page


[ ] Make the map page pins actually have functionality, and when they click the pin it opens up the view trip page

[ ] the close 'x' button top left of front cover page on trip page needs to be same exact same place as the page day header 'x'


BACKEND Checklist

[ ] We will do this after everything is ready.