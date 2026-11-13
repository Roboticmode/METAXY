/**
 * Hero footage and stills, shared by the hero and the final CTA.
 *
 * TODO(landing): the clips below are the component's placeholder footage. Swap in South African
 * day/night footage (e.g. a Joburg street or a township spaza by day and at night): put the files in
 * `public/hero/day.mp4` / `public/hero/night.mp4`, change DAY_SRC / NIGHT_SRC, and re-capture the
 * posters (`public/hero/day.jpg` / `night.jpg`, a still from ~1 s into each clip). Keep each clip
 * short (≤ 10 s, ≤ 4 MB) so the page loads on mobile data. Serving from `public/` also keeps the hero
 * working on bad venue Wi-Fi.
 */
export const DAY_SRC = "https://cdn.21st.dev/assets/mirror/a6/a639af57ee941fdd518c604efb043501ad0e815dcce9f7efba850998bafa3453.mp4";
export const NIGHT_SRC = "https://cdn.21st.dev/assets/mirror/4b/4badf32b0bc920a2fd1b066182eee89e98d8615f680e01fb19ff62fb56e86872.mp4";
export const DAY_POSTER = "/hero/day.jpg";
export const NIGHT_POSTER = "/hero/night.jpg";
