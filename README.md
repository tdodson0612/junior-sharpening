# Junior's Edge — Website

Plain HTML, CSS and JavaScript. No build step.

## Run it locally
Open the folder in VS Code, install the **Live Server** extension, then right-click
`index.html` → "Open with Live Server". (Opening the file by double-clicking works too,
but the custom fonts only load through a server like Live Server or the live site.)

## Folders
- `images/` — original JPGs plus smaller AVIF/WebP copies the site actually uses.
- `fonts/` — self-hosted fonts (Big Shoulders, IBM Plex). Free under the SIL Open
  Font License; the license files are in the same folder.

## Things to edit
- Phone, email, location and hours: Contact section in `index.html` (marked `TODO`).
- Prices: the Pricing section in `index.html` **and** the `prices` list in `script.js`.
- Shop numbers (blades sharpened, turnaround, etc.): the `facts` list near the top of `index.html`.
- The contact form doesn't send email yet — connect it to Formspree, Netlify Forms or EmailJS.
