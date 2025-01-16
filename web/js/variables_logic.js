import { app } from "../../scripts/app.js";

const colors = {
    true: {
        title: "#223322",  // Green title
        body: "#335533"    // Green background
    },
    false: {
        title: "#332233",  // Purple title
        body: "#553355"    // Purple background
    }
};

app.registerExtension({
    name: "Comfy.VariablesLogic",
    beforeRegisterNodeDef(nodeType) {
        if (nodeType.comfyClass === "VariablesLogicNode") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                if (onNodeCreated) {
                    onNodeCreated.apply(this, arguments);
                }

                // Add this check for labels input
                if (!this.inputs?.find(input => input.name === "labels")) {
                    this.addInput("labels", "STRING");
                }

                // Clear all widgets
                this.widgets.length = 0;

                // Add single toggle widget with basic callback
                const widget = this.addWidget("toggle", "condition", false, (value) => {
                    // Update colors when value changes
                    const newColors = colors[value];
                    this.color = newColors.title;
                    this.bgcolor = newColors.body;
                    this.setDirtyCanvas(true, true);

                    // Update text if we have a connected input
                    this.updateLabels();
                });

                // Set initial state
                widget.options = { on: "no input", off: "no input" };
                this.color = colors.false.title;
                this.bgcolor = colors.false.body;

                // Add label update method
                this.updateLabels = function() {
                    if (!this.widgets?.[0]) return;
                    
                    // Check if we have an input connection
                    if (this.inputs?.[0]?.link) {
                        const linkId = this.inputs[0].link;
                        const stringNode = this.graph?._nodes_by_id[
                            this.graph?.links[linkId]?.origin_id
                        ];
                        
                        if (stringNode?.widgets?.[0]?.value) {
                            const parts = stringNode.widgets[0].value.split("|");
                            if (parts.length === 2) {
                                this.widgets[0].options = {
                                    off: parts[0].trim(),
                                    on: parts[1].trim()
                                };
                            }
                        }
                    } else {
                        this.widgets[0].options = { on: "no input", off: "no input" };
                    }
                };

                // Handle connections
                this.onConnectionsChange = function(type, index, connected) {
                    setTimeout(() => this.updateLabels(), 1);
                };
            };
        }
    }
});