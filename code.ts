/// <reference types="@figma/plugin-typings" />

// Canvas-side of the plugin: applies bytes the UI already fetched from
// Pollinations, and reads the selection's own image bytes back out when the
// UI needs something to edit. All network calls happen in ui.html, where
// Blob/FormData are guaranteed to exist; this sandbox only touches the canvas.

const DEFAULT_IMAGE_SIZE = 512;

figma.showUI(__html__, { width: 340, height: 480 });

type UiMessage =
    | { type: "load-settings" }
    | { type: "save-settings"; apiKey: string; model: string }
    | { type: "apply-image"; bytes: Uint8Array; target: "fill" | "new" }
    | { type: "get-selected-image" }
    | { type: "notify"; message: string };

figma.ui.onmessage = async (msg: UiMessage) => {
    switch (msg.type) {
        case "load-settings": {
            const apiKey = (await figma.clientStorage.getAsync("apiKey")) ?? "";
            const model = (await figma.clientStorage.getAsync("model")) ?? "flux";
            figma.ui.postMessage({ type: "settings", apiKey, model });
            break;
        }
        case "save-settings": {
            await figma.clientStorage.setAsync("apiKey", msg.apiKey);
            await figma.clientStorage.setAsync("model", msg.model);
            break;
        }
        case "apply-image": {
            applyImage(msg.bytes, msg.target);
            break;
        }
        case "get-selected-image": {
            const bytes = await getSelectedImageBytes();
            figma.ui.postMessage({ type: "selected-image", bytes });
            break;
        }
        case "notify": {
            figma.notify(msg.message);
            break;
        }
    }
};

function applyImage(bytes: Uint8Array, target: "fill" | "new"): void {
    const image = figma.createImage(bytes);
    const paint: ImagePaint = { type: "IMAGE", scaleMode: "FILL", imageHash: image.hash };

    const fillableSelection = figma.currentPage.selection.filter(
        (node) => "fills" in node && Array.isArray((node as { fills?: unknown }).fills),
    ) as (SceneNode & { fills: Paint[] })[];

    if (target === "fill" && fillableSelection.length > 0) {
        for (const node of fillableSelection) {
            node.fills = [paint];
        }
        figma.notify(`Filled ${fillableSelection.length} node(s).`);
        return;
    }

    const rect = figma.createRectangle();
    rect.resize(DEFAULT_IMAGE_SIZE, DEFAULT_IMAGE_SIZE);
    rect.x = figma.viewport.center.x - DEFAULT_IMAGE_SIZE / 2;
    rect.y = figma.viewport.center.y - DEFAULT_IMAGE_SIZE / 2;
    rect.fills = [paint];
    figma.currentPage.appendChild(rect);
    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);
    figma.notify("Inserted generated image.");
}

async function getSelectedImageBytes(): Promise<Uint8Array | null> {
    for (const node of figma.currentPage.selection) {
        if (!("fills" in node)) continue;
        const fills = (node as { fills: Paint[] | typeof figma.mixed }).fills;
        if (fills === figma.mixed || !Array.isArray(fills)) continue;
        const imageFill = fills.find((fill): fill is ImagePaint => fill.type === "IMAGE");
        if (!imageFill) continue;
        const image = figma.getImageByHash(imageFill.imageHash as string);
        if (!image) continue;
        return await image.getBytesAsync();
    }
    figma.notify("Select a shape with an image fill first.");
    return null;
}
