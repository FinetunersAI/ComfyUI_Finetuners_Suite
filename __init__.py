from .nodes import (
    NODE_CLASS_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS,
    AutoImageResize,
    GroupLink,
    VariablesInjector,
    ModelListNode,
    VariablesLogicNode  
)

WEB_DIRECTORY = "./web/js"

print("\033[34mComfyUI Finetuners: \033[92mLoaded\033[0m")

__all__ = [
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS",
    "AutoImageResize",
    "GroupLink",
    "VariablesInjector",
    "ModelListNode",
    "VariablesLogicNode"  
]
