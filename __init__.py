"""
ComfyUI Drag Error Fix

Suppresses the "Cannot read properties of undefined (reading 'config')" error
that occurs when dragging nodes with widgets from the sidebar.

This is a ComfyUI frontend bug that affects all nodes with widgets.
This extension provides a global fix without modifying ComfyUI core.
"""

class DragErrorFixNode:
    """
    A minimal utility node that loads the drag error suppression.

    The actual fix is in the web extension (web/fix.js).
    This node just provides a visible indicator that the fix is installed.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": {}
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("status",)
    FUNCTION = "get_status"
    CATEGORY = "utils"
    OUTPUT_NODE = True

    def get_status(self):
        return ("ComfyUI Drag Error Fix - Active ✓",)


NODE_CLASS_MAPPINGS = {
    "DragErrorFix": DragErrorFixNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DragErrorFix": "🔧 Drag Error Fix",
}

# Tell ComfyUI to load our web extension
WEB_DIRECTORY = "./web"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']
