# Pollinations for Figma

Generate and edit images with [Pollinations](https://gen.pollinations.ai) inside Figma, paying with your own Pollen.

Built for [pollinations/pollinations#15572](https://github.com/pollinations/pollinations/issues/15572).

## Install (development mode — not yet published to Figma Community)

```bash
git clone https://github.com/tomdacatto/pollinations-figma
cd pollinations-figma
npm install
npm run build
```

In Figma: **Menu → Plugins → Development → Import plugin from manifest...**, select this folder's `manifest.json`.

## Setup

Get a free API key at [enter.pollinations.ai/keys](https://enter.pollinations.ai/keys) and paste it into the plugin panel's **API key** field the first time you run it. It's saved via `figma.clientStorage` (this file only, not synced elsewhere).

## Use

Run **Plugins → Development → Pollinations**:

- **Fill selected shape** — generates an image from the prompt and sets it as the fill of every selected frame/shape.
- **Insert as new image** — generates an image and drops it onto the canvas as a new rectangle, even with nothing selected.
- **Edit selected image** — reads the image fill off the selected shape, uploads it to Pollinations, and re-generates it from your prompt (e.g. "make it night time") using an image-editing model, then fills the selection with the result.

Set **Model** to any id from [gen.pollinations.ai/image/models](https://gen.pollinations.ai/image/models) — defaults to `flux`.

## How it works

- `code.ts` runs in Figma's plugin sandbox and only touches the canvas: reading the selection's image bytes, creating the generated image, applying fills.
- `ui.html` is a plain iframe that does the actual network calls (`fetch` to `gen.pollinations.ai`, and `media.pollinations.ai/upload` for the edit flow) — Figma's plugin sandbox supports `fetch` directly, but `Blob`/`FormData` for the multipart upload are only reliable in a real browser context, hence the small UI-side split.
- `manifest.json` declares `networkAccess.allowedDomains` for exactly those two hosts.

## Status

Type-checks cleanly (`npm run build`) against `@figma/plugin-typings`; not yet run inside the Figma desktop or web app (no Figma install in the build environment). [Issues](https://github.com/tomdacatto/pollinations-figma/issues) and PRs welcome.

## Credit

Uses the [Pollinations API](https://pollinations.ai). Design pattern (canvas plugin filling a selection from a generated image) follows the [GIMP plug-in](https://github.com/pollinations/pollinations/tree/main/apps/gimp-pollinations) already in the Pollinations catalog.

## License

MIT
