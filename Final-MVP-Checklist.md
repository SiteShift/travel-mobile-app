Final MVP Checklist 


[DONE] Make the trip image on the home page to look like a 3d book with spine
[DONE] Make book animation to use the same blank book template

[DONE] After creating a trip (in the book animation flow), show a celebration / dopamine-hit moment

[DONE] Level top right on home page needs work. Level 1 with badge on the left

[DONE]  Levelling lightbox - make dotted horizontal line more transparent. Also make it like '-•-•-•-'

[DONE]  Develop the levelling system - Add Trip +50 points, +1 point per image, Replace achievemnets in profile page to be missions where when you complete it you get more points, like +100 share the app, add 3 trips, etc. 


[DONE]  optimise the level lightbox to load quicker
  ✅ Implemented 2025-08-13: Optimized `LevelLightbox` with native-driven scroll, stricter FlatList virtualization (initialNumToRender=1, windowSize=3, maxToRenderPerBatch=2, removeClippedSubviews), `initialScrollIndex` for instant positioning, and `expo-image` tuning (recyclingKey, allowDownscaling, priority, cachePolicy). Result: noticeably faster open and swiping with lower memory use; no visual or functional changes.


[DONE] Change dark mode to be dark grey instead of dark blue. Make sure all text, elements etc work on dark mode.
  ✅ Implemented 2025-08-13: Updated dark theme to neutral greys in `src/constants/theme.ts` (background.primary=#121212, secondary=#1a1a1a, tertiary=#222222; surfaces to matching greys; text/border tuned for contrast). Components use `useTheme()` colors, so visuals update automatically. Status bar remains light-content in dark mode via `SafeAreaWrapper`.


[DONE] On the profile page make profile picture changable so user can change it to whatevr they want

[DONE] XP/progress bar on profile needs to be synced with their level. 

[DONE] On home page when you click ellipse to edit cover or delete trip - they should be able to edit title and description and cover. Change edit cover to be 'Edit Trip' and it lets them change image, title and description. Also add a share trip so they can share their trip which will get more people to download the app

[DONE] Add light and dark toggle to the profile page

[DONE] the close 'x' button top left of front cover page on trip page needs to be same exact same place as the page day header 'x'

[DONE] CREATE the trippin game. Add functionality and sound effects and other image assets.


[DONE] Add 'Location' in create trip page so user can add where they are going. This can be mapped in profile page to count towards 'Countries' and can add mission 'Go to 5 Countries' etc.



[Partially Done] Optimise the 3D carosel as the more trips you add the app gets very laggy. LOG  VirtualizedList: You have a large list that is slow to update - make sure your renderItem function renders components that follow React performance best practices like PureComponent, shouldComponentUpdate, etc. {"contentLength": 2656.666748046875, "dt": 1706, "prevDt": 8775}.

The functionaity is complexy so need to be careful. 

[ ] Make trip image overlay cover the image properly and make sure there is only 1 image overlay per trip image. This needs to be coded carefully, cleanly and optimised for performance.



[DONE] Need to adjust levels to make sure people cant level up too slow or too fast. Each level needs more xp points on each. Also on the level lightbox each progress bar needs to be coloured depending on the level image. Only level 1 has 'Level 1' pill in top left corner, all unlocked levels need to have a level pill top left corner - again - with the same colour as badge image - I will explain to use what colour for each level.

[DONE] 3 cards - countries, trips and photos - make sure the progress bar below makes sense to levelling sysyem

[DONE] Make sure XP levelling system is fully synced



[ ] When you level up - next time you go to home page the level lightbox opens up and there is a slow reveal of the new level badge and some other animations - dopamine hit. Can also add an mp3 sound effect. 


[DONE] Add custom images for each mission. Mission laders - I have created progressive image badge evolution for each mission.



[ ] The app needs to do permissions when first opening? We are going to do an onboarding eventually but we need to handle permissions so user can take photos, but more importantly so when they create trip it can use their location so it can pin pointed on the map



[DONE] Make the map page pins actually have functionality, and when they click the pin it opens up the view trip page


[DONE] Camera needs to be improved. need to remove all video related code. Also when user takes photo it needs to save to their phone. Make sure when they select a trip to add photo it actually adds it

[DONE] Need to make max level 10. On my account im on level 14. Needs to be restricted to 10.

[DONE] Dark mode needs to have orange buttons - also go through all pages to make sure dark mode looks good

[DONE] Improve the 'Play Trippin' section on profile and move it above missions.

[ ] 

[ ] 

[ ] Add collaboration - so people can share trips and collaborate and both/all of them can add photos.

[ ] Add privacy Policy and terms and service


[ ] Create the onboarding pages

[ ] Create the create account page with placeholders Continue with Apple + Continue with Google

[ ] Create paywall screen placeholder only

[ ] Notifications





BACKEND Checklist

[ ] We will do this after everything is complete on frontend. DO NOT DO ANYTHING YET. A PLAN MUST BE CREATED TO FIGURE OUT EVERYTHING.

[ ] Supabase for Auth and small backend (NO STORAGE). Syncing levels.

[ ] Revenuecat for payments


FINAL LAST Checklist

[ ] Performance, Security, warnings and legal compliance

[ ] Run a build to check for build errors.

[ ] In app.json or app.config.ts:

name, slug
ios.bundleIdentifier (e.g. com.triptmemo.app)
version and ios.buildNumber (string, bump each submit)
Permissions strings (camera/photos/location) if used
App icon / splash
If you use deep links: scheme


[ ] Make a dev build to test native code outside Expo Go


[ ] Create the TestFlight build

[ ] Submit to TestFlight

[ ] Submit to TestFlight

[ ] Submit to TestFlight

[ ] Submit to TestFlight

[ ] Then in App Store Connect:

Create the App record (name, primary language, bundle ID, SKU).

Add the uploaded build to TestFlight.

Internal testing: add yourself/team instantly.

External testing: fill compliance/notes → Beta App Review (usually quick).



[ ] Store listing & compliance checklist (must-do)

App Info: subtitle, keywords, description, category.

Screenshots (6.7", 6.1", iPad if supported).

Age rating questionnaire.

Encryption export compliance (usually “uses standard encryption”).

Privacy:

Privacy Policy URL.

Data collection (App Privacy “nutrition label”).

ATT prompt if tracking/IDFA (or declare “No tracking”).

Push notifications: if used, EAS can upload the APNs key automatically; ensure you’ve enabled notifications capability.

Sign-in test creds for review if needed.


[ ]  Ship to the App Store