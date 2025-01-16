import torch
import os
import csv

from comfy.utils import lanczos

class AutoImageResize:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "image": ("IMAGE",),
                "desired_width": ("INT", {"default": 1024, "min": 64, "max": 8192, "step": 8}),
            }
        }

    RETURN_TYPES = ("IMAGE", "INT", "INT")
    RETURN_NAMES = ("image", "width", "height")
    FUNCTION = "execute"
    CATEGORY = "finetuners"

    def execute(self, image, desired_width):
        # Get current dimensions
        _, current_height, current_width, _ = image.shape
        
        # Calculate target width and scale factor
        target_width = current_width
        if current_width < 1024 or current_width > 1344:
            target_width = desired_width
            scale_factor = desired_width / current_width
        else:
            # No resize needed
            return (image, current_width, current_height)
            
        # Calculate new height maintaining aspect ratio
        target_height = int(current_height * scale_factor)
        
        # Convert to NCHW for lanczos
        x = image.permute(0, 3, 1, 2)
        
        # Perform lanczos resize
        x = lanczos(x, target_width, target_height)
        
        # Convert back to NHWC
        x = x.permute(0, 2, 3, 1)
        
        return (x, target_width, target_height)


class GroupLink:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {}}
    
    RETURN_TYPES = ()
    FUNCTION = "noop"
    CATEGORY = "finetuners"

    def noop(self):
        return {}


class VariablesInjector:    
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "Var1": ("STRING", {"forceInput": True}),
                "prompt": ("STRING", {"multiline": True, "height": 4})
            },
            "hidden": {
                "Var2": ("STRING", {"forceInput": True}),
                "Var3": ("STRING", {"forceInput": True}),
                "Var4": ("STRING", {"forceInput": True}),
                "Var5": ("STRING", {"forceInput": True}),
                "Var6": ("STRING", {"forceInput": True}),
                "Var7": ("STRING", {"forceInput": True}),
                "Var8": ("STRING", {"forceInput": True})
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "inject"
    CATEGORY = "finetuners"
    
    def parse_var_input(self, input_str):
        """Parse input string in format 'name | value'"""
        if not input_str:
            return None, None
            
        parts = input_str.split("|", 1)
        if len(parts) == 2:
            return parts[0].strip(), parts[1].strip()
        return None, input_str.strip()
    
    def inject(self, prompt, **kwargs):
        result = prompt
        
        # Process each var input
        for i in range(1, 9):
            var_key = f'Var{i}'
            var_input = kwargs.get(var_key)
            
            if var_input:  # Only process if we have a value
                name, value = self.parse_var_input(var_input)
                if name:  # Only inject if we got a valid name
                    result = result.replace(f"!{name}", str(value))
        
        return (result,)


class ModelListNode:
    """Node that provides model selection from a CSV list"""
    
    # Class variable to store the current list of names
    current_names = [""]
    
    @classmethod
    def get_csv_path(cls):
        """Get the CSV path from modellocation.txt"""
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            location_file = os.path.join(current_dir, "modellocation.txt")
            
            if os.path.exists(location_file):
                with open(location_file, 'r') as f:
                    base_path = f.read().strip()
                    csv_path = os.path.join(base_path, "modelist.csv")
                    return csv_path
        except Exception as e:
            print(f"Error reading location file: {str(e)}")
        
        # Fallback to local directory if location file not found or invalid
        return os.path.join(os.path.dirname(os.path.abspath(__file__)), "modelist.csv")
    
    @classmethod
    def load_names_from_csv(cls):
        """Load names from CSV file"""
        try:
            csv_path = cls.get_csv_path()
            if os.path.exists(csv_path):
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    names = [row['Name on list'] for row in reader]
                    if names:
                        cls.current_names = names
                        return names
        except Exception as e:
            print(f"Error reading CSV: {str(e)}")
        return [""]

    @classmethod
    def INPUT_TYPES(s):
        s.load_names_from_csv()  # Load names when input types are requested
        return {
            "required": {
                "model_name": (s.current_names, {"default": s.current_names[0] if s.current_names else ""})
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = ("M", "P", "S")
    FUNCTION = "get_model_info"
    CATEGORY = "finetuners"
    
    def get_model_info(self, model_name):
        try:
            csv_path = self.get_csv_path()
            if os.path.exists(csv_path):
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        if row['Name on list'] == model_name:
                            # Get the path and make it a single-item list
                            model_path = row['model path']
                            # Add comma to make it splittable by string-to-combo
                            if not model_path.endswith(','):
                                model_path = model_path + ','
                            
                            return (
                                model_path,  # Will be converted to COMBO by string-to-combo
                                row['prefix'],
                                row['sufix']
                            )
        except Exception as e:
            print(f"Error reading CSV: {str(e)}")
        
        return ("", "", "")

class VariablesLogicNode:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "labels": ("STRING", {"forceInput": True}),  # Force string input
            },
            "optional": {
                "condition": ("BOOLEAN", {"default": False}),  # Optional boolean for toggle
            }
        }
    
    RETURN_TYPES = ("BOOLEAN",)
    RETURN_NAMES = ("condition",)
    FUNCTION = "execute"
    CATEGORY = "variables/logic"

    def execute(self, labels, condition=False):
        return (condition,)

# Node mappings
NODE_CLASS_MAPPINGS = {
    "VariablesInjector": VariablesInjector,
    "AutoImageResize": AutoImageResize,
    "GroupLink": GroupLink,
    "ModelListNode": ModelListNode,
    "VariablesLogicNode": VariablesLogicNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "VariablesInjector": "Variables Injector",
    "AutoImageResize": "Auto Image Resize",
    "GroupLink": "Group Link",
    "ModelListNode": "Model List",
    "VariablesLogicNode": "Variables Logic"
}

# Informs user that nodes are loaded
print("\033[34mComfyUI Finetuners: \033[92mLoaded\033[0m")