import { app } from "/scripts/app.js";

app.registerExtension({
    name: "Comfy.Finetuners.GroupLink",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "GroupLink") return;

        // Store original onNodeCreated
        const onNodeCreated = nodeType.prototype.onNodeCreated;

        nodeType.prototype.onNodeCreated = function() {
            // Call original onNodeCreated if it exists
            const r = onNodeCreated?.apply(this, arguments);

            // Initialize properties
            this.properties = this.properties || {};
            this.properties["masterGroup"] = this.properties["masterGroup"] || "";
            this.properties["slaveGroup"] = this.properties["slaveGroup"] || "";
            this.properties["showNav"] = true;
            this.serialize_widgets = true;
            this.size = [240, 120];  // Start with expanded size
            this.modeOn = LiteGraph.ALWAYS;
            this.modeOff = LiteGraph.NEVER;
            
            // Add custom styles
            this.addProperty("bgcolor", "#454545");
            this.addProperty("boxcolor", "#666");
            this.shape = LiteGraph.BOX_SHAPE;
            this.round_radius = 8;
            
            // Remove inputs/outputs
            this.removable = true;
            this.removeInput(0);
            this.removeOutput(0);

            // Store states
            this.toggleValue = false;
            this.showGroups = true;  // Start expanded

            // Override the node's drawing function
            this.onDrawForeground = function(ctx) {
                // Update node size based on state
                this.size[1] = this.showGroups ? 120 : 50;

                // Hide/show widgets
                for (const w of this.widgets || []) {
                    if (w.name === "Master Group" || w.name === "Slave Group") {
                        w.hidden = !this.showGroups;
                    }
                }

                const y = this.showGroups ? this.size[1] - 35 : 15;
                
                // Draw expand/collapse triangle
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.moveTo(20, y + 5);
                ctx.lineTo(30, y + 10);
                ctx.lineTo(20, y + 15);
                ctx.closePath();
                ctx.fill();

                // Draw ON/OFF text
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.fillText(this.toggleValue ? "ON" : "OFF", this.size[0]/2, y + 12);
                
                // Draw toggle track
                ctx.fillStyle = "#666";
                ctx.beginPath();
                ctx.roundRect(this.size[0] - 45, y + 2, 30, 16, 8);
                ctx.fill();

                // Draw toggle circle
                ctx.fillStyle = this.toggleValue ? "#4CAF50" : "#f44336";
                ctx.beginPath();
                const toggleRadius = 8;
                ctx.arc(this.size[0] - 23, y + 10, toggleRadius, 0, Math.PI * 2);
                ctx.fill();
            };

            // Handle mouse clicks
            this.onMouseDown = function(e, local_pos) {
                const y = this.showGroups ? this.size[1] - 35 : 15;
                
                // Handle expand/collapse triangle click
                if (local_pos[1] >= y && local_pos[1] <= y + 20 &&
                    local_pos[0] >= 15 && local_pos[0] <= 35) {
                    this.showGroups = !this.showGroups;
                    this.setDirtyCanvas(true, true);
                    return true;
                }

                // Handle toggle click
                if (local_pos[1] >= y && local_pos[1] <= y + 20 &&
                    local_pos[0] >= this.size[0] - 45) {
                    this.toggleValue = !this.toggleValue;
                    this.updateGroupStates();
                    return true;
                }
            };

            // Refresh widgets on creation
            setTimeout(() => this.refreshWidgets(), 100);

            return r;
        };

        nodeType.prototype.onAdded = function(graph) {
            this.graph = graph;
            this.refreshWidgets();
            // Initial state setup
            this.updateGroupStates();
        };

        nodeType.prototype.updateGroupStates = function() {
            if (!this.graph) return;

            const masterGroup = this.graph._groups.find(g => g.title === this.properties["masterGroup"]);
            const slaveGroup = this.graph._groups.find(g => g.title === this.properties["slaveGroup"]);

            if (masterGroup) {
                masterGroup.recomputeInsideNodes();
                for (const node of masterGroup._nodes) {
                    node.mode = (this.toggleValue ? this.modeOn : this.modeOff);
                }
            }

            if (slaveGroup) {
                slaveGroup.recomputeInsideNodes();
                for (const node of slaveGroup._nodes) {
                    node.mode = (this.toggleValue ? this.modeOn : this.modeOff);
                }
            }

            app.graph.setDirtyCanvas(true, false);
        };

        nodeType.prototype.refreshWidgets = function() {
            if (!this.graph?._groups) return;
            
            const groups = [...this.graph._groups].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
            const groupTitles = groups.map(g => g.title || "Untitled");
            
            // Clear existing widgets
            if (!this.widgets) {
                this.widgets = [];
            }
            this.widgets.length = 0;
            
            // Add master group selection
            const masterWidget = this.addWidget("combo", "Master Group", this.properties["masterGroup"], (v) => {
                this.properties["masterGroup"] = v;
                this.updateGroupStates();
            }, { values: groupTitles });
            
            // Add slave group selection
            const slaveWidget = this.addWidget("combo", "Slave Group", this.properties["slaveGroup"], (v) => {
                this.properties["slaveGroup"] = v;
                this.updateGroupStates();
            }, { values: groupTitles });
        };

        // Handle graph reloading
        nodeType.prototype.onConfigure = function(info) {
            // Restore properties
            if (info.properties) {
                this.properties = {...info.properties};
            }
            // Restore toggle state
            if (info.toggleValue !== undefined) {
                this.toggleValue = info.toggleValue;
            }
            // Update states after loading
            setTimeout(() => {
                this.updateGroupStates();
            }, 100);
        };

        // Save additional state
        const onSerialize = nodeType.prototype.onSerialize;
        nodeType.prototype.onSerialize = function(info) {
            if (onSerialize) {
                onSerialize.apply(this, arguments);
            }
            // Save toggle state
            info.toggleValue = this.toggleValue;
        };
    }
});
