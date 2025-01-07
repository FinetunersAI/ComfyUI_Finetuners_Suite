import { app } from "/scripts/app.js";

app.registerExtension({
    name: "ComfyUI/Finetuners.VariablesInjector",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "VariablesInjector") {
            // Handle configuration
            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function() {
                if (onConfigure) {
                    onConfigure.apply(this, arguments);
                }

                this.properties = this.properties || {};
                
                if (!this.inputs?.find(input => input.name === "Var1")) {
                    this.addInput("Var1", "STRING");
                }
            };

            // Handle dynamic inputs and widget positioning
            nodeType.prototype.onConnectionsChange = function (type, index, connected, link_info) {
                setTimeout(() => {
                    const countVars = this.inputs.filter(input => 
                        input.name.startsWith('Var') && input.link !== null
                    ).length;
                    
                    const currentVars = this.inputs.filter(input => 
                        input.name.startsWith('Var')
                    ).length;

                    if (countVars >= currentVars && currentVars < 8) {
                        this.addInput(`Var${currentVars + 1}`, "STRING");
                    }

                    // Update widget position and node size
                    if (this.widgets?.[0]) {
                        const numInputs = this.inputs.filter(i => i.name.startsWith('Var')).length;
                        const heightPerInput = 25;
                        const spacing = 10;
                        
                        // Position prompt widget
                        this.widgets[0].y = numInputs * heightPerInput + spacing;
                        
                        // Update node size
                        this.size[1] = this.widgets[0].y + 60;
                        
                        // Force widget recompute
                        this.setDirtyCanvas(true, true);
                    }
                }, 1);
            };
        }
    }
});