# ComfyUI_Finetuners_Suite
A suite of nodes for ComfyUI that helps making ComfyUI more accesible for artists

## Nodes

### 🔄 Variables Injector
Dynamically replace placeholders (like !variable_name) in a text prompt with actual values, making it easy to reuse and modify prompts without changing their structure.

### 📐 Auto Image Resize
Automatically resizes images based on a desired width while maintaining aspect ratio, using high-quality Lanczos scaling.

### 🔗 Group Link
A utility node that allows you to link and toggle multiple groups of nodes simultaneously, helping you organize and control complex workflows.

## Variables Injector Node

The Variables Injector node allows you to dynamically replace placeholders in your prompts with variable values. This makes it easy to reuse prompts with different values.

![image](https://github.com/user-attachments/assets/8a815ae3-2c7a-4ec4-8ea3-9876ffda7ddd)


### How to Use

1. Load the Variables Injector node into your workflow
2. Connect a string node to Var1's input
3. Use the following syntax in the string node: `variable_name | variable_value`
   - For example: `item | bag`
4. In your prompt, reference the variable using `!variable_name`
   - For example: `"A woman holding a !item"`
5. The node will replace `!item` with `bag` in the final prompt
6. You can add as many variables as you like using Var1 through Var8

### Example
Input string: `item | bag`
Prompt: `"A woman holding a !item"`
Result: `"A woman holding a bag"`

## Credits

- Custom nodes were developed by Finetuners
- Variables Injector's UI was created with the help of Shmuel Ronen (https://github.com/ShmuelRonen)
- The group link custom node is heavily based on RGThree mute groups node

## Installation

1. Clone this repository into your `ComfyUI/custom_nodes` directory:
```bash
cd custom_nodes
git clone https://github.com/FinetunersAI/finetunersTest.git
```

2. Restart ComfyUI

## Usage

After installation, you'll find the nodes in the node menu under the "finetuners" category.
