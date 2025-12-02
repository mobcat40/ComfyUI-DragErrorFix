/**
 * ComfyUI Drag Error Fix
 *
 * PROBLEM:
 * When dragging nodes with widgets from the sidebar, ComfyUI throws this error:
 * "TypeError: Cannot read properties of undefined (reading 'config')"
 *
 * ROOT CAUSE:
 * - Bug in ComfyUI's NodeWidgets.vue component (minified frontend bundle)
 * - During drag preview rendering, Vue tries to access $variant.config
 * - $variant is undefined because drag preview is rendered in isolation (no Vue context)
 * - This triggers errors in console AND toast notifications
 *
 * THE FIX:
 * Three-layer suppression system:
 * 1. DOM MutationObserver - Removes toast notifications before they're visible
 * 2. console.error patch - Suppresses console spam
 * 3. window.onerror - Fallback for any window-level errors
 *
 * WHEN TO REMOVE:
 * When ComfyUI fixes their frontend (adds optional chaining: this.$variant?.config)
 * Check: https://github.com/Comfy-Org/ComfyUI_frontend/issues
 *
 * SCOPE:
 * This fix is GLOBAL - it suppresses the error for ALL nodes in ComfyUI.
 * The error is harmless and drag/drop continues to work perfectly.
 */

import { app } from "../../scripts/app.js";

// =============================================================================
// LAYER 1: Toast Notification Suppression (DOM)
// =============================================================================

const suppressToastNotifications = () => {
    // Watch for toast notifications being added to the DOM
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) { // Element node
                    // Check if this is a toast detail element
                    if (node.classList?.contains('p-toast-detail') ||
                        node.querySelector?.('.p-toast-detail')) {

                        const toastDetail = node.classList?.contains('p-toast-detail')
                            ? node
                            : node.querySelector('.p-toast-detail');

                        if (toastDetail) {
                            const text = toastDetail.textContent || '';

                            // Check if this is the drag preview config error toast
                            if (text.includes("Cannot read properties of undefined") &&
                                text.includes("config")) {

                                // Find and remove the entire toast container
                                let toastContainer = toastDetail.closest('.p-toast-message') ||
                                                    toastDetail.closest('.p-toast') ||
                                                    toastDetail.parentElement;

                                if (toastContainer) {
                                    toastContainer.remove();
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // Start observing the document body for toast additions
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

// Install the toast suppressor when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', suppressToastNotifications);
} else {
    suppressToastNotifications();
}

// =============================================================================
// LAYER 2: Console Error Suppression
// =============================================================================

const originalConsoleError = console.error;

console.error = function(...args) {
    // Check all arguments for the drag preview error signature
    // Need to check both string representations AND Error object stack traces
    const allArgsString = args.map(a => {
        if (a instanceof Error) {
            // For Error objects, include both message and stack
            return a.message + ' ' + (a.stack || '');
        }
        return String(a);
    }).join(' ');

    // Signature of the bug:
    // - Message contains "Cannot read properties of undefined"
    // - Reading the 'config' property specifically
    // - Stack includes 'renderDragPreview', 'NodeWidgets', or '$variant'
    const isDragPreviewError =
        (allArgsString.includes("Cannot read properties of undefined") &&
         allArgsString.includes("config")) &&
        (allArgsString.includes('renderDragPreview') ||
         allArgsString.includes('NodeWidgets') ||
         allArgsString.includes('$variant') ||
         allArgsString.includes('Proxy.$variant'));

    if (isDragPreviewError) {
        // Suppress - don't log
        return;
    }

    // Not the drag preview error - log normally
    originalConsoleError.apply(console, args);
};

// =============================================================================
// LAYER 3: Window Error Handler (Fallback)
// =============================================================================

window.addEventListener('error', (event) => {
    if (event.message?.includes("Cannot read properties of undefined") &&
        event.message?.includes("reading 'config'")) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
}, true);

// =============================================================================
// NODE REGISTRATION
// =============================================================================

app.registerExtension({
    name: "comfyui.drag.error.fix",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        // Only process our specific node
        if (nodeData.name !== "DragErrorFix") return;

        // Nothing special to do - the node works out of the box!
        // The error suppression above handles the ComfyUI bug globally.
        console.log('[ComfyUI-DragErrorFix] ✓ Drag preview error suppression active');
    }
});
