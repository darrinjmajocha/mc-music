# PROGRAM_NAME_PLACEHOLDER

A static GitHub Pages music player that randomly plays tracks from one music folder, filters songs by the number at the start of each filename, waits between songs, and repeats while the browser tab remains open.

## How to add music

1. Put each audio file directly in the single `music/` folder. Do not put audio inside `.gitkeep`; `.gitkeep` is only an empty placeholder file that keeps the folder visible in Git.
2. Name each file with a category number before the first dash:
   - `1-` = Overworld
   - `2-` = Nether
   - `3-` = End
   - `4-` = Water
   - `5-` = Ancient City
3. Add each filename to the `window.MUSIC_FILES` list in `tracks.js`. This is not a second copy of the audio; it is only a text list that GitHub Pages uses because browser JavaScript cannot scan a folder automatically.
4. Replace `PROGRAM_NAME_PLACEHOLDER` in `index.html` and this README with the name you want displayed.

For example, if `music/1-01. Key.m4a` is listed in `tracks.js`, it is included when the user selects `1 - Overworld` and ignored when the user deselects `1 - Overworld`.
