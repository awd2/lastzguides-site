(function () {
    "use strict";

    var STORAGE_KEY = "lastz.researchPlanner.v3";
    var LEGACY_STORAGE_KEY = "lastz.researchPlanner.v2";
    var LEGACY_NODE_STORAGE_KEY = "lastz.researchPlanner.v1";
    var data = window.LastZResearchPlannerData;
    var plannerLocale = detectPlannerLocale();
    if (!data || !Array.isArray(data.branches)) {
        return;
    }

    var branches = data.branches;
    var branchById = new Map(branches.map(function (branch) {
        return [branch.id, branch];
    }));
    var nodeByKey = new Map();
    var branchMaps = new Map();

    branches.forEach(function (branch) {
        var nodes = new Map();
        branch.nodes.forEach(function (node) {
            nodes.set(node.id, node);
            nodeByKey.set(nodeKey(branch.id, node.id), { branch: branch, node: node });
        });
        branchMaps.set(branch.id, nodes);
    });

    var state = {
        activeBranchId: branches[0] ? branches[0].id : null,
        view: "tree",
        autoParents: true,
        statsOpen: false,
        levels: {},
        targets: {},
        selectedKey: null,
        mobileSheet: null
    };

    var refs = {
        totalBadges: document.querySelector("[data-total-badges]"),
        completedBadges: document.querySelector("[data-completed-badges]"),
        completedLevels: document.querySelector("[data-completed-levels]"),
        plannedBadges: document.querySelector("[data-planned-badges]"),
        plannedLevels: document.querySelector("[data-planned-levels]"),
        remainingBadges: document.querySelector("[data-remaining-badges]"),
        branchList: document.querySelector("[data-branch-list]"),
        branchSummary: document.querySelector("[data-branch-summary]"),
        branchOverview: document.querySelector("[data-branch-overview]"),
        warningPanel: document.querySelector("[data-warning-panel]"),
        statPanel: document.querySelector("[data-stat-panel]"),
        plannerView: document.querySelector("[data-planner-view]"),
        branchSelect: document.querySelector("[data-branch-select]"),
        branchMenuButton: document.querySelector("[data-branch-menu-button]"),
        branchMenu: document.querySelector("[data-branch-menu]"),
        totalLabel: document.querySelector("[data-total-label]"),
        completedLabel: document.querySelector("[data-completed-label]"),
        plannedLabel: document.querySelector("[data-planned-label]"),
        remainingLabel: document.querySelector("[data-remaining-label]"),
        remainingNote: document.querySelector("[data-remaining-note]"),
        copyShare: document.querySelector("[data-copy-share]"),
        clearTargets: document.querySelector("[data-clear-targets]"),
        resetPlanner: document.querySelector("[data-reset-planner]"),
        autoParentControls: Array.prototype.slice.call(document.querySelectorAll("[data-auto-parents]")),
        shareStatus: document.querySelector("[data-share-status]"),
        tabs: Array.prototype.slice.call(document.querySelectorAll("[data-view]")),
        statToggle: document.querySelector("[data-toggle-stats]"),
        drawer: document.querySelector("[data-node-drawer]"),
        drawerContent: document.querySelector("[data-drawer-content]"),
        mobileSheet: document.querySelector("[data-mobile-sheet]"),
        mobileSheetContent: document.querySelector("[data-mobile-sheet-content]")
    };

    init();

    function init() {
        loadState();
        importShareState();
        bindActions();
        render();
    }

    function bindActions() {
        refs.copyShare.addEventListener("click", function () {
            trackPlannerUse({
                action: "copy_share",
                branch_id: state.activeBranchId,
                planner_view: state.view
            });
            copyShareLink();
        });
        refs.clearTargets.addEventListener("click", function () {
            var before = Object.keys(state.targets).length;
            state.targets = {};
            saveState();
            render();
            trackPlannerUse({
                action: "clear_targets",
                branch_id: state.activeBranchId,
                planner_view: state.view,
                cleared_target_count: before
            });
            setStatus("Targets cleared.");
        });
        refs.resetPlanner.addEventListener("click", function () {
            var beforeLevels = Object.keys(state.levels).length;
            var beforeTargets = Object.keys(state.targets).length;
            state.levels = {};
            state.targets = {};
            state.selectedKey = null;
            saveState();
            render();
            closeDrawer();
            trackPlannerUse({
                action: "planner_reset",
                branch_id: state.activeBranchId,
                planner_view: state.view,
                cleared_levels: beforeLevels,
                cleared_targets: beforeTargets
            });
            setStatus("Planner reset.");
        });
        refs.autoParentControls.forEach(function (control) {
            control.addEventListener("change", function () {
                setAutoParents(control.checked);
            });
        });
        refs.branchSelect.addEventListener("change", function () {
            var previous = state.activeBranchId;
            state.activeBranchId = refs.branchSelect.value;
            state.selectedKey = null;
            saveState();
            closeDrawer();
            render();
            trackPlannerUse({
                action: "select_branch",
                branch_id: state.activeBranchId,
                planner_view: state.view,
                previous_branch_id: previous
            });
        });
        refs.branchMenuButton.addEventListener("click", function () {
            var open = refs.branchMenu.hidden;
            refs.branchMenu.hidden = !open;
            refs.branchMenuButton.setAttribute("aria-expanded", String(open));
        });
        refs.branchMenu.addEventListener("click", function (event) {
            var button = event.target.closest("[data-branch-choice]");
            if (!button) {
                return;
            }
            var previous = state.activeBranchId;
            state.activeBranchId = button.getAttribute("data-branch-choice");
            state.selectedKey = null;
            refs.branchMenu.hidden = true;
            refs.branchMenuButton.setAttribute("aria-expanded", "false");
            saveState();
            closeDrawer();
            render();
            trackPlannerUse({
                action: "select_branch_from_menu",
                branch_id: state.activeBranchId,
                planner_view: state.view,
                previous_branch_id: previous
            });
        });
        document.addEventListener("click", function (event) {
            if (refs.branchMenu.hidden || event.target.closest(".branch-picker")) {
                return;
            }
            refs.branchMenu.hidden = true;
            refs.branchMenuButton.setAttribute("aria-expanded", "false");
        });
        refs.statToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            openStatsControl();
        });
        refs.tabs.forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                openViewControl(button);
            });
        });
        refs.branchList.addEventListener("click", function (event) {
            var button = event.target.closest("[data-branch-id]");
            if (!button) {
                return;
            }
            var previous = state.activeBranchId;
            state.activeBranchId = button.getAttribute("data-branch-id");
            state.selectedKey = null;
            saveState();
            closeDrawer();
            render();
            if (previous !== state.activeBranchId) {
                trackPlannerUse({
                    action: "select_branch_list",
                    branch_id: state.activeBranchId,
                    planner_view: state.view,
                    previous_branch_id: previous
                });
            }
        });
        if (refs.branchOverview) {
            refs.branchOverview.addEventListener("click", function (event) {
                var button = event.target.closest("[data-branch-card]");
                if (!button) {
                    return;
                }
                var previous = state.activeBranchId;
                state.activeBranchId = button.getAttribute("data-branch-card");
                state.selectedKey = null;
                saveState();
                closeDrawer();
                render();
                var workspace = document.querySelector(".planner-workspace");
                if (workspace && previous !== state.activeBranchId) {
                    workspace.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                trackPlannerUse({
                    action: "select_branch_overview",
                    branch_id: state.activeBranchId,
                    planner_view: state.view,
                    previous_branch_id: previous
                });
            });
        }
        refs.branchSummary.addEventListener("click", handlePlannerClick);
        refs.branchSummary.addEventListener("change", function (event) {
            var control = event.target.closest("[data-auto-parents]");
            if (control) {
                setAutoParents(control.checked);
                return;
            }
            handlePlannerChange(event);
        });
        refs.plannerView.addEventListener("click", handlePlannerClick);
        refs.plannerView.addEventListener("change", handlePlannerChange);
        refs.drawer.addEventListener("click", function (event) {
            if (event.target.closest("[data-close-drawer]")) {
                closeDrawer();
            }
        });
        refs.drawerContent.addEventListener("click", handlePlannerClick);
        refs.drawerContent.addEventListener("change", handlePlannerChange);
        if (refs.mobileSheet) {
            refs.mobileSheet.addEventListener("click", function (event) {
                if (event.target.closest("[data-close-sheet]")) {
                    closeMobileSheet();
                }
            });
            refs.mobileSheetContent.addEventListener("click", handlePlannerClick);
            refs.mobileSheetContent.addEventListener("change", handlePlannerChange);
        }
    }

    function trackPlannerUse(payload) {
        if (!window.analytics || typeof window.analytics.trackEvent !== "function") {
            return;
        }
        var data = payload || {};
        var eventData = {
            planner_id: "research-planner",
            page_path: window.location.pathname || "/",
            planner_view: state.view,
            branch_id: data.branch_id || state.activeBranchId || "",
            action: data.action || ""
        };
        Object.keys(data).forEach(function (key) {
            if (key !== "action" && key !== "branch_id") {
                eventData[key] = data[key];
            }
        });
        window.analytics.trackEvent("planner_use", eventData);
    }

    function setAutoParents(enabled) {
        var previous = state.autoParents;
        state.autoParents = !!enabled;
        saveState();
        render();
        trackPlannerUse({
            action: "toggle_auto_parents",
            branch_id: state.activeBranchId,
            planner_view: state.view,
            enabled: state.autoParents ? "1" : "0",
            changed: previous === state.autoParents ? "0" : "1"
        });
    }

    function loadState() {
        var saved = readJsonStorage(STORAGE_KEY);
        if (saved && saved.v === 3) {
            state.activeBranchId = branchById.has(saved.activeBranchId) ? saved.activeBranchId : state.activeBranchId;
            state.view = saved.view === "table" ? "table" : "tree";
            state.autoParents = saved.autoParents !== false;
            state.statsOpen = false;
            state.levels = cleanLevelMap(saved.levels);
            state.targets = cleanLevelMap(saved.targets);
            return;
        }

        var legacy = readJsonStorage(LEGACY_STORAGE_KEY);
        if (legacy && legacy.v === 2) {
            state.activeBranchId = branchById.has(legacy.activeBranchId) ? legacy.activeBranchId : state.activeBranchId;
            state.levels = cleanLevelMap(legacy.levels);
            state.targets = cleanLevelMap(legacy.targets);
            state.autoParents = legacy.autoParents !== false;
            return;
        }

        legacy = readJsonStorage(LEGACY_NODE_STORAGE_KEY);
        if (legacy) {
            state.activeBranchId = branchById.has(legacy.activeBranchId) ? legacy.activeBranchId : state.activeBranchId;
            migrateLegacyMap(legacy.completed, "levels");
            migrateLegacyMap(legacy.planned, "targets");
        }
    }

    function importShareState() {
        var params = new URLSearchParams(window.location.search);
        var payload = params.get("p");
        if (!payload) {
            return;
        }
        try {
            var decoded = JSON.parse(base64UrlDecode(payload));
            if (decoded.v === 2) {
                state.activeBranchId = branchById.has(decoded.b) ? decoded.b : state.activeBranchId;
                state.view = decoded.view === "table" ? "table" : "tree";
                state.autoParents = decoded.a !== 0;
                state.statsOpen = false;
                state.levels = arrayToLevelMap(decoded.l);
                state.targets = arrayToLevelMap(decoded.t);
                saveState();
                setStatus("Shared plan loaded.");
            } else if (decoded.v === 1) {
                state.activeBranchId = branchById.has(decoded.b) ? decoded.b : state.activeBranchId;
                state.levels = {};
                state.targets = {};
                migrateLegacyMap(arrayToBooleanMap(decoded.c), "levels");
                migrateLegacyMap(arrayToBooleanMap(decoded.p), "targets");
                saveState();
                setStatus("Shared plan loaded.");
            }
        } catch (error) {
            setStatus("Could not load shared plan.");
        }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            v: 3,
            activeBranchId: state.activeBranchId,
            view: state.view,
            viewport: isSmallScreen() ? "mobile" : "desktop",
            autoParents: state.autoParents,
            statsOpen: state.statsOpen,
            levels: state.levels,
            targets: state.targets
        }));
    }

    function render() {
        var changedTargets = normalizeTargetPrerequisites();
        if (changedTargets) {
            saveState();
        }
        refs.autoParentControls.forEach(function (control) {
            control.checked = state.autoParents;
        });
        refs.tabs.forEach(function (button) {
            var isActive = isSmallScreen() ? button.getAttribute("data-view") === "tree" : button.getAttribute("data-view") === state.view;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", String(isActive));
        });
        refs.statToggle.classList.toggle("is-active", state.statsOpen);
        refs.statToggle.setAttribute("aria-expanded", String(state.statsOpen));
        renderTotals();
        renderBranchSelect();
        renderBranchList();
        renderBranchOverview();
        renderBranchWorkspace();
        renderDrawer();
        renderMobileSheet();
    }

    function renderTotals() {
        var activeBranch = branchById.get(state.activeBranchId);
        var branchScoped = isSmallScreen() && activeBranch;
        var totals = branchScoped ? calculateTotals([activeBranch]) : calculateTotals(branches);
        var scopeTotal = branchScoped ? activeBranch.totalBadges : data.totalBadges;
        refs.totalBadges.textContent = formatNumber(scopeTotal);
        refs.completedBadges.textContent = formatNumber(totals.completedBadges);
        refs.completedLevels.textContent = totals.completedLevels + " of " + totals.totalLevels + " levels";
        refs.plannedBadges.textContent = formatNumber(totals.plannedBadges);
        refs.plannedLevels.textContent = totals.targetLevels + " target levels";
        refs.remainingBadges.textContent = formatNumber(scopeTotal - totals.completedBadges);
        if (refs.totalLabel) {
            refs.totalLabel.textContent = branchScoped ? "Branch total" : "Total";
        }
        if (refs.remainingNote) {
            refs.remainingNote.textContent = branchScoped ? "in selected branch" : "after spent";
        }
    }

    function renderBranchSelect() {
        refs.branchSelect.innerHTML = branches.map(function (branch) {
            return '<option value="' + escapeAttr(branch.id) + '"' + (branch.id === state.activeBranchId ? " selected" : "") + ">" + escapeHtml(branch.name) + "</option>";
        }).join("");
        refs.branchSelect.value = state.activeBranchId;
        var activeBranch = branchById.get(state.activeBranchId);
        refs.branchMenuButton.textContent = activeBranch ? activeBranch.name : "Select branch";
        refs.branchMenu.innerHTML = branches.map(function (branch) {
            return [
                '<button type="button" class="branch-picker-option',
                branch.id === state.activeBranchId ? " is-active" : "",
                '" data-branch-choice="', escapeAttr(branch.id), '">',
                '<span>', escapeHtml(branch.name), "</span>",
                branch.id === state.activeBranchId ? '<strong aria-hidden="true">✓</strong>' : "",
                "</button>"
            ].join("");
        }).join("");
    }

    function renderBranchList() {
        refs.branchList.innerHTML = "";
        branches.forEach(function (branch) {
            var summary = calculateTotals([branch]);
            var button = document.createElement("button");
            button.type = "button";
            button.className = "branch-button" + (branch.id === state.activeBranchId ? " is-active" : "");
            button.setAttribute("data-branch-id", branch.id);
            button.innerHTML = [
                '<span class="branch-button-title"><span>',
                escapeHtml(branch.name),
                '</span><span>',
                summary.completedLevels,
                "/",
                summary.totalLevels,
                "</span></span>",
                '<span class="branch-progress" aria-hidden="true"><span style="width:',
                branch.totalBadges ? Math.round(summary.completedBadges / branch.totalBadges * 100) : 0,
                '%"></span></span>',
                '<span class="branch-button-meta">',
                '<span><strong>', formatNumber(summary.completedBadges), "</strong> spent</span>",
                '<span><strong>', formatNumber(summary.plannedBadges), "</strong> target</span>",
                '<span><strong>', formatNumber(summary.remainingBadges), "</strong> left</span>",
                "</span>"
            ].join("");
            refs.branchList.appendChild(button);
        });
    }

    function renderBranchOverview() {
        if (!refs.branchOverview) {
            return;
        }
        refs.branchOverview.innerHTML = branches.map(function (branch) {
            var summary = calculateTotals([branch]);
            var targetBadges = summary.completedBadges + summary.plannedBadges;
            var donePct = branch.totalBadges ? Math.round(summary.completedBadges / branch.totalBadges * 100) : 0;
            var targetPct = branch.totalBadges ? Math.round(targetBadges / branch.totalBadges * 100) : 0;
            return [
                '<button type="button" class="branch-card',
                branch.id === state.activeBranchId ? " is-active" : "",
                '" data-branch-card="', escapeAttr(branch.id), '">',
                '<span class="branch-card-kicker">', escapeHtml(branch.unlockRequirements && branch.unlockRequirements.length ? branch.unlockRequirements.join(" + ") : "Open branch"), "</span>",
                '<strong>', escapeHtml(branch.name), "</strong>",
                '<span class="branch-card-total">★ ', formatNumber(branch.totalBadges), "</span>",
                '<span class="branch-card-meta">',
                '<span>', summary.completedLevels, "/", summary.totalLevels, " levels</span>",
                '<span>', branch.nodes.length, " nodes</span>",
                "</span>",
                '<span class="branch-card-progress" aria-hidden="true">',
                '<span class="branch-card-target" style="width:', targetPct, '%"></span>',
                '<span class="branch-card-done" style="width:', donePct, '%"></span>',
                "</span>",
                '<span class="branch-card-plan">',
                '<span><b>', formatNumber(summary.completedBadges), "</b> done</span>",
                '<span><b>', formatNumber(targetBadges), "</b> target</span>",
                "</span>",
                "</button>"
            ].join("");
        }).join("");
    }

    function renderBranchWorkspace() {
        var branch = branchById.get(state.activeBranchId);
        if (!branch) {
            refs.branchSummary.innerHTML = "";
            refs.plannerView.innerHTML = "";
            return;
        }

        var summary = calculateTotals([branch]);
        var pct = branch.totalBadges ? Math.round(summary.completedBadges / branch.totalBadges * 100) : 0;
        var targetActive = summary.plannedBadges > 0;
        var viewButtonTarget = !isSmallScreen() && state.view === "table" ? "tree" : "table";
        var viewButtonLabel = viewButtonTarget === "tree" ? "Map" : "Table";
        var viewButtonIcon = viewButtonTarget === "tree" ? "↔" : "☰";
        var statsClass = state.statsOpen && !isSmallScreen() ? " is-active" : "";
        var mobileControls = [
            '<div class="branch-summary-controls" aria-label="Branch view controls">',
            '<button type="button" class="planner-tab planner-tool-button" data-view="', viewButtonTarget, '"><span class="tool-icon" aria-hidden="true">', viewButtonIcon, '</span><span>', viewButtonLabel, '</span></button>',
            '<label class="planner-toggle planner-toggle--toolbar"><input type="checkbox" data-auto-parents', state.autoParents ? " checked" : "", '><span>Prereqs</span></label>',
            '<button type="button" class="icon-button planner-tool-button', statsClass, '" data-toggle-stats aria-expanded="', state.statsOpen && !isSmallScreen() ? "true" : "false", '"><span class="tool-icon" aria-hidden="true">▥</span><span>Stats</span></button>',
            "</div>"
        ].join("");
        refs.branchSummary.innerHTML = [
            '<div class="branch-summary-head">',
            '<div class="branch-summary-title">',
            "<h2>", escapeHtml(branch.name), "</h2>",
            "</div>",
            '<div class="branch-summary-metrics">',
            '<span class="branch-summary-metric"><span>Spent</span><strong>', formatNumber(summary.completedBadges), '</strong></span>',
            '<span class="branch-summary-metric"><span>Remaining</span><strong>', formatNumber(summary.remainingBadges), '</strong></span>',
            targetActive ? '<span class="branch-summary-metric branch-summary-goal"><span>Goal</span><strong>' + formatNumber(summary.plannedBadges) + '</strong><button type="button" class="summary-clear-target" data-action="clear-branch-targets" data-branch-id="' + escapeAttr(branch.id) + '" aria-label="Clear target goal">x</button></span>' : "",
            "</div>",
            mobileControls,
            '<button type="button" class="planner-button planner-button--muted" data-action="clear-branch" data-branch-id="', escapeAttr(branch.id), '">Clear</button>',
            "</div>",
            '<div class="summary-progress"><span style="width:', pct, '%"></span></div>',
            '<p class="branch-summary-meta">',
            branch.nodes.length, " nodes / ", summary.totalLevels, " levels",
            branch.unlockRequirements.length ? " · Unlock: " + escapeHtml(branch.unlockRequirements.join(" + ")) : "",
            "</p>"
        ].join("");

        renderWarnings(branch);
        renderStats(branch);
        if (!isSmallScreen() && state.view === "table") {
            renderTable(branch);
        } else {
            renderTree(branch);
        }
    }

    function renderWarnings(branch) {
        var warnings = dependencyWarnings(branch);
        if (warnings.messages.length === 0) {
            refs.warningPanel.hidden = true;
            refs.warningPanel.innerHTML = "";
            return;
        }
        refs.warningPanel.hidden = false;
        refs.warningPanel.innerHTML = [
            "<h3>Prerequisite warnings</h3>",
            "<ul>",
            warnings.messages.map(function (warning) {
                return "<li>" + escapeHtml(warning) + "</li>";
            }).join(""),
            "</ul>"
        ].join("");
    }

    function renderStats(branch) {
        var stats = aggregateStats(branch);
        if (isSmallScreen() || !state.statsOpen || stats.length === 0) {
            refs.statPanel.hidden = true;
            refs.statPanel.innerHTML = "";
            return;
        }
        refs.statPanel.hidden = false;
        refs.statPanel.innerHTML = renderStatsMarkup(stats);
    }

    function renderStatsMarkup(stats) {
        return [
            '<div class="stat-panel-head"><h3>Branch stats</h3><span>current / target / max</span></div>',
            '<div class="stat-grid">',
            stats.map(function (stat) {
                var pct = stat.total ? Math.min(100, Math.round(stat.target / stat.total * 100)) : 0;
                return [
                    '<div class="stat-card">',
                    '<span>', escapeHtml(stat.label), "</span>",
                    "<strong>", escapeHtml(formatStat(stat.earned, stat.format)), " / ", escapeHtml(formatStat(stat.target, stat.format)), " / ", escapeHtml(formatStat(stat.total, stat.format)), "</strong>",
                    '<small><span style="width:', pct, '%"></span></small>',
                    "</div>"
                ].join("");
            }).join(""),
            "</div>"
        ].join("");
    }

    function renderTree(branch) {
        var scrollPosition = getTreeScrollPosition();
        var layout = treeLayout(branch);
        var warningKeys = dependencyWarnings(branch).keys;
        refs.plannerView.innerHTML = [
            '<div class="tree-scroll">',
            '<div class="tree-stage" style="width:', Math.ceil(layout.width), 'px;height:', Math.ceil(layout.height), 'px;">',
            '<div class="tree-canvas-inner" style="width:', layout.width, 'px;height:', layout.height, 'px;">',
            renderEdges(branch, layout),
            branch.nodes.map(function (node) {
                return renderTreeNode(branch, node, layout, warningKeys.has(nodeKey(branch.id, node.id)));
            }).join(""),
            "</div>",
            "</div>",
            "</div>"
        ].join("");
        restoreTreeScrollPosition(scrollPosition);
    }

    function renderEdges(branch, layout) {
        var nodeMap = branchMaps.get(branch.id);
        var paths = (branch.edges || []).map(function (edge) {
            var source = nodeMap.get(edge.source);
            var target = nodeMap.get(edge.target);
            if (!source || !target) {
                return "";
            }
            var a = layout.points.get(source.id);
            var b = layout.points.get(target.id);
            var startX = a.x + layout.nodeWidth / 2;
            var startY = a.y + layout.nodeHeight;
            var endX = b.x + layout.nodeWidth / 2;
            var endY = b.y;
            var midY = startY + (endY - startY) / 2;
            return [
                '<path d="M ', startX, " ", startY,
                " C ", startX, " ", midY, ", ", endX, " ", midY, ", ", endX, " ", endY,
                '" />'
            ].join("");
        }).join("");
        return '<svg class="tree-edges" width="' + layout.width + '" height="' + layout.height + '" aria-hidden="true">' + paths + "</svg>";
    }

    function renderTreeNode(branch, node, layout, hasWarning) {
        var key = nodeKey(branch.id, node.id);
        var point = layout.points.get(node.id);
        var done = getLevel(key);
        var target = getTarget(key);
        var progress = node.maxLevel ? Math.round(done / node.maxLevel * 100) : 0;
        var planned = target > done ? rangeCost(node, done, target) : 0;
        var remaining = node.totalBadges - costToLevel(node, done);
        var classes = [
            "tree-node",
            done >= node.maxLevel ? "is-complete" : "",
            done > 0 && done < node.maxLevel ? "is-partial" : "",
            target > done ? "has-target" : "",
            hasWarning ? "has-warning" : ""
        ].filter(Boolean).join(" ");
        return [
            '<article class="', classes, '" style="left:', point.x, 'px;top:', point.y, 'px;">',
            '<button type="button" class="node-corner node-corner--left', target > done ? " is-selected" : "", '" data-action="', target > done ? "clear-target" : "plan-max", '" data-key="', escapeAttr(key), '" aria-label="', target > done ? "Clear target for " : "Set max target for ", escapeAttr(node.name), '" title="', target > done ? "Clear target" : "Set target", '">⚑</button>',
            '<button type="button" class="node-corner node-corner--right', done >= node.maxLevel ? " is-selected" : "", '" data-action="', done >= node.maxLevel ? "clear" : "max", '" data-key="', escapeAttr(key), '" aria-label="', done >= node.maxLevel ? "Clear completed levels for " : "Complete ", escapeAttr(node.name), '" title="', done >= node.maxLevel ? "Clear done" : "Mark done", '">✓</button>',
            '<button type="button" class="tree-node-open" data-action="open-node" data-key="', escapeAttr(key), '" aria-label="Open ', escapeAttr(node.name), ' details, ', escapeAttr(planned ? formatNumber(planned) + " target badges" : formatNumber(remaining) + " badges left"), '">',
            '<span class="node-hex">', escapeHtml(initials(node.name)), "</span>",
            '<span class="tree-node-title">', escapeHtml(node.name), "</span>",
            '<span class="tree-node-grid">',
            '<span class="node-level-stat"><small>Level</small><strong>', done, "/", node.maxLevel, "</strong></span>",
            '<span class="node-remaining-stat"><small>Remaining</small><strong>★ ', formatNumber(remaining), "</strong></span>",
            "</span>",
            '<span class="node-progress"><span style="width:', progress, '%"></span></span>',
            "</button>",
            "</article>"
        ].join("");
    }

    function renderTable(branch) {
        if (isSmallScreen()) {
            renderMobileList(branch);
            return;
        }
        refs.plannerView.innerHTML = [
            '<div class="planner-table-wrap">',
            '<table class="planner-table">',
            "<thead><tr><th>Node</th><th>Done</th><th>Target</th><th>Spent</th><th>Target cost</th><th>Remaining</th><th>Prereqs</th><th>Actions</th></tr></thead>",
            "<tbody>",
            branch.nodes.map(function (node) {
                var key = nodeKey(branch.id, node.id);
                var done = getLevel(key);
                var target = getTarget(key);
                var spent = costToLevel(node, done);
                var planned = target > done ? rangeCost(node, done, target) : 0;
                var parents = node.parents && node.parents.length ? node.parents.map(function (parentId) {
                    return findNodeName(branch, parentId);
                }).join(", ") : "-";
                return [
                    '<tr class="', done >= node.maxLevel ? "is-complete" : "", target > done ? " has-target" : "", '">',
                    '<td><button type="button" class="table-node-name" data-action="open-node" data-key="', escapeAttr(key), '">', escapeHtml(node.name), "</button></td>",
                    '<td>', levelSelect("completed", key, done, node.maxLevel), "</td>",
                    '<td>', levelSelect("target", key, target, node.maxLevel), "</td>",
                    "<td>", formatNumber(spent), "</td>",
                    "<td>", formatNumber(planned), "</td>",
                    "<td>", formatNumber(node.totalBadges - spent), "</td>",
                    "<td>", escapeHtml(parents), "</td>",
                    '<td><div class="row-actions">',
                    miniButton("complete-parents", key, "Fill prereqs"),
                    miniButton("max", key, "Max"),
                    miniButton("clear", key, "Clear"),
                    "</div></td>",
                    "</tr>"
                ].join("");
            }).join(""),
            "</tbody>",
            "</table>",
            "</div>"
        ].join("");
    }

    function renderMobileList(branch) {
        refs.plannerView.innerHTML = renderMobileListMarkup(branch);
    }

    function renderMobileListMarkup(branch) {
        return [
            '<div class="node-list">',
            branch.nodes.map(function (node) {
                var key = nodeKey(branch.id, node.id);
                var done = getLevel(key);
                var target = getTarget(key);
                var spent = costToLevel(node, done);
                var planned = target > done ? rangeCost(node, done, target) : 0;
                var remaining = node.totalBadges - spent;
                return [
                    '<article class="node-list-card', done >= node.maxLevel ? " is-complete" : "", target > done ? " has-target" : "", '">',
                    '<button type="button" class="node-list-title" data-action="open-node" data-key="', escapeAttr(key), '">',
                    '<span class="node-icon">', escapeHtml(initials(node.name)), "</span>",
                    '<span><strong>', escapeHtml(node.name), '</strong><small>Lv. ', done, "/", node.maxLevel, target > done ? " -> " + target : "", "</small></span>",
                    "</button>",
                    '<div class="node-list-controls">',
                    '<label>Done ', levelSelect("completed", key, done, node.maxLevel), "</label>",
                    '<label>Target ', levelSelect("target", key, target, node.maxLevel), "</label>",
                    "</div>",
                    '<div class="node-list-metrics">',
                    '<span><strong>', formatNumber(spent), '</strong> spent</span>',
                    '<span><strong>', formatNumber(planned), '</strong> target</span>',
                    '<span><strong>', formatNumber(remaining), '</strong> left</span>',
                    "</div>",
                    '<div class="row-actions">',
                    miniButton("complete-parents", key, "Fill prereqs"),
                    miniButton("max", key, "Max"),
                    miniButton("clear", key, "Clear"),
                    "</div>",
                    "</article>"
                ].join("");
            }).join(""),
            "</div>"
        ].join("");
    }

    function renderDrawer() {
        if (!state.selectedKey || !nodeByKey.has(state.selectedKey)) {
            refs.drawer.hidden = true;
            refs.drawerContent.innerHTML = "";
            return;
        }
        var item = nodeByKey.get(state.selectedKey);
        var branch = item.branch;
        var node = item.node;
        var done = getLevel(state.selectedKey);
        var target = getTarget(state.selectedKey);
        var spent = costToLevel(node, done);
        var planned = target > done ? rangeCost(node, done, target) : 0;
        var remaining = node.totalBadges - spent;
        var pct = node.maxLevel ? Math.round(done / node.maxLevel * 100) : 0;
        refs.drawer.hidden = false;
        refs.drawerContent.innerHTML = [
            '<div class="drawer-head">',
            '<span class="drawer-icon drawer-icon--hex">', escapeHtml(initials(node.name)), "</span>",
            '<div class="drawer-title">',
            "<p>", escapeHtml(branch.name), "</p><h2 id=\"drawer-title\">", escapeHtml(node.name), "</h2>",
            '<span>Lv. ', done, "/", node.maxLevel, target > done ? " · target " + target : "", "</span>",
            "</div>",
            '<div class="drawer-remaining"><span>Remaining</span><strong>★ ', formatNumber(remaining), "</strong><small>", done, "/", node.maxLevel, "</small></div>",
            "</div>",
            '<div class="drawer-progress"><span style="width:', pct, '%"></span></div>',
            '<div class="drawer-quick">',
            '<button type="button" class="drawer-trash" data-action="clear" data-key="', escapeAttr(state.selectedKey), '" aria-label="Clear ', escapeAttr(node.name), '">⌫</button>',
            '<div class="drawer-stepper" aria-label="Completed level controls">',
            miniButton("dec", state.selectedKey, "-"),
            '<strong>', done, "</strong>",
            miniButton("inc", state.selectedKey, "+"),
            "</div>",
            '<button type="button" class="mini-button" data-action="complete-parents" data-key="', escapeAttr(state.selectedKey), '">Fill prereqs</button>',
            '<button type="button" class="mini-button" data-action="plan-max" data-key="', escapeAttr(state.selectedKey), '">Target max</button>',
            planned > 0 ? '<span class="drawer-target-cost">Target ★ ' + formatNumber(planned) + "</span>" : "",
            "</div>",
            renderLevelTable(node, state.selectedKey, done, target)
        ].join("");
    }

    function renderLevelTable(node, key, done, target) {
        var rows = node.badgeCost.map(function (cost, index) {
            var level = index + 1;
            return [
                '<tr class="', level <= done ? "is-done" : "", level === target && target > done ? " is-target" : "", '">',
                '<td><input type="checkbox" data-action="toggle-level" data-key="', escapeAttr(key), '" data-level="', level, '" ', level <= done ? "checked" : "", "></td>",
                "<td>", level, "</td>",
                "<td>★ ", formatNumber(cost), "</td>",
                '<td><button type="button" class="flag-button flag-button--icon', level === target && target > done ? " is-selected" : "", '" data-action="target-level" data-key="', escapeAttr(key), '" data-level="', level, '" aria-label="Set target level ', level, '">⚑</button></td>',
                "</tr>"
            ].join("");
        }).join("");
        return [
            '<div class="level-table-wrap drawer-levels">',
            '<table class="level-table">',
            "<thead><tr><th></th><th>Lv</th><th>Badges</th><th></th></tr></thead>",
            "<tbody>",
            rows,
            "</tbody>",
            "</table>",
            "</div>"
        ].join("");
    }

    function openMobileSheet(type) {
        state.mobileSheet = type;
        renderMobileSheet();
    }

    function closeMobileSheet() {
        state.mobileSheet = null;
        renderMobileSheet();
    }

    function renderMobileSheet() {
        if (!refs.mobileSheet || !refs.mobileSheetContent) {
            return;
        }
        if (!state.mobileSheet || !isSmallScreen()) {
            refs.mobileSheet.hidden = true;
            refs.mobileSheetContent.innerHTML = "";
            return;
        }
        var branch = branchById.get(state.activeBranchId);
        if (!branch) {
            refs.mobileSheet.hidden = true;
            refs.mobileSheetContent.innerHTML = "";
            return;
        }
        refs.mobileSheet.hidden = false;
        if (state.mobileSheet === "table") {
            refs.mobileSheetContent.innerHTML = [
                '<div class="planner-sheet-head">',
                '<h2 id="planner-sheet-title">', escapeHtml(branch.name), " Table</h2>",
                '<p>Node levels, targets, badge spend, and remaining cost.</p>',
                "</div>",
                renderMobileListMarkup(branch)
            ].join("");
        } else {
            refs.mobileSheetContent.innerHTML = [
                '<div class="planner-sheet-head">',
                '<h2 id="planner-sheet-title">', escapeHtml(branch.name), " Stats</h2>",
                '<p>Current / target / max bonuses for this branch.</p>',
                "</div>",
                renderStatsMarkup(aggregateStats(branch))
            ].join("");
        }
    }

    function handlePlannerClick(event) {
        var statToggle = event.target.closest("[data-toggle-stats]");
        if (statToggle) {
            openStatsControl();
            return;
        }
        var viewButton = event.target.closest("[data-view]");
        if (viewButton) {
            openViewControl(viewButton);
            return;
        }
        var actionEl = event.target.closest("[data-action]");
        if (!actionEl) {
            return;
        }
        var action = actionEl.getAttribute("data-action");
        var key = actionEl.getAttribute("data-key");
        var branchId = actionEl.getAttribute("data-branch-id");
        var level = Number(actionEl.getAttribute("data-level") || 0);
        var applied = false;

        if (action === "open-node" && key) {
            state.selectedKey = key;
            renderDrawer();
            trackPlannerUse({
                action: "open_node",
                branch_id: state.activeBranchId,
                key: key,
                level: level,
                planner_view: state.view
            });
            return;
        }
        if (action === "clear-branch-targets" && branchId) {
            clearBranchTargets(branchId);
            saveState();
            render();
            trackPlannerUse({
                action: "clear_branch_targets",
                branch_id: branchId,
                planner_view: state.view
            });
            return;
        }
        if (action === "clear-branch" && branchId) {
            clearBranch(branchId);
            saveState();
            render();
            trackPlannerUse({
                action: "clear_branch",
                branch_id: branchId,
                planner_view: state.view,
                source: "planner_grid"
            });
            return;
        }
        if (key && nodeByKey.has(key)) {
            applied = applyNodeAction(action, key, level, actionEl);
            if (!applied) {
                return;
            }
            saveState();
            render();
            actionEl.blur();
            trackPlannerUse({
                action: "node_action",
                branch_id: key.split(":")[0],
                key: key,
                node_action: action,
                level: level,
                planner_view: state.view,
                action_applied: applied ? "1" : "0"
            });
        }
    }

    function openStatsControl() {
        if (isSmallScreen()) {
            openMobileSheet("stats");
            trackPlannerUse({
                action: "open_mobile_stats",
                branch_id: state.activeBranchId,
                planner_view: "tree"
            });
            return;
        }
        state.statsOpen = !state.statsOpen;
        saveState();
        render();
        trackPlannerUse({
            action: "toggle_stats",
            branch_id: state.activeBranchId,
            planner_view: state.view,
            state: state.statsOpen ? "open" : "closed"
        });
    }

    function openViewControl(button) {
        if (isSmallScreen() && button.getAttribute("data-view") === "table") {
            openMobileSheet("table");
            trackPlannerUse({
                action: "open_mobile_table",
                branch_id: state.activeBranchId,
                planner_view: "tree"
            });
            return;
        }
        var previous = state.view;
        state.view = button.getAttribute("data-view") === "table" ? "table" : "tree";
        saveState();
        render();
        if (previous !== state.view) {
            trackPlannerUse({
                action: "switch_view",
                branch_id: state.activeBranchId,
                planner_view: state.view,
                previous_view: previous
            });
        }
    }

    function handlePlannerChange(event) {
        var select = event.target.closest("[data-level-select]");
        if (!select) {
            return;
        }
        var key = select.getAttribute("data-key");
        var mode = select.getAttribute("data-level-select");
        var level = Number(select.value || 0);
        if (!key || !nodeByKey.has(key)) {
            return;
        }
        var previous = mode === "completed" ? getLevel(key) : getTarget(key);
        var changed = false;
        if (mode === "completed") {
            changed = setCompletedLevel(key, level);
        } else {
            changed = setTargetLevel(key, level);
        }
        if (!changed) {
            return;
        }
        saveState();
        render();
        trackPlannerUse({
            action: "change_level",
            branch_id: key.split(":")[0],
            key: key,
            mode: mode,
            previous: previous,
            level: level
        });
    }

    function getTreeScrollPosition() {
        if (state.view !== "tree") {
            return null;
        }
        var scroll = refs.plannerView.querySelector(".tree-scroll");
        return scroll ? { left: scroll.scrollLeft, top: scroll.scrollTop } : null;
    }

    function restoreTreeScrollPosition(position) {
        if (!position) {
            return;
        }
        var scroll = refs.plannerView.querySelector(".tree-scroll");
        if (!scroll) {
            return;
        }
        scroll.scrollLeft = position.left;
        scroll.scrollTop = position.top;
    }

    function applyNodeAction(action, key, level, element) {
        var item = nodeByKey.get(key);
        var done = getLevel(key);
        if (action === "toggle-level") {
            return setCompletedLevel(key, element.checked ? level : level - 1);
        } else if (action === "target-level") {
            return setTargetLevel(key, getTarget(key) === level ? 0 : level);
        } else if (action === "inc") {
            return setCompletedLevel(key, done + 1);
        } else if (action === "dec") {
            return setCompletedLevel(key, done - 1);
        } else if (action === "max") {
            return setCompletedLevel(key, item.node.maxLevel);
        } else if (action === "clear") {
            var targetRemoved = done < item.node.maxLevel && getTarget(key) > 0;
            setCompletedLevel(key, 0);
            delete state.targets[key];
            return done > 0 || targetRemoved;
        } else if (action === "plan-max") {
            return setTargetLevel(key, item.node.maxLevel);
        } else if (action === "clear-target") {
            var hadTarget = clearBranchTargets(item.branch.id);
            return hadTarget;
        } else if (action === "complete-parents") {
            completeAncestors(item.branch, item.node);
            return true;
        }
    }

    function setCompletedLevel(key, level) {
        var item = nodeByKey.get(key);
        if (!item) {
            return false;
        }
        var previous = getLevel(key);
        var next = clampLevel(level, item.node.maxLevel);
        if (previous === next) {
            return false;
        }
        if (next > 0) {
            state.levels[key] = next;
        } else {
            delete state.levels[key];
        }
        if (getTarget(key) <= next) {
            delete state.targets[key];
        }
        if (state.autoParents && next > previous) {
            completeAncestors(item.branch, item.node, next);
        }
        return true;
    }

    function setTargetLevel(key, level) {
        var item = nodeByKey.get(key);
        if (!item) {
            return false;
        }
        var next = clampLevel(level, item.node.maxLevel);
        var previous = getTarget(key);
        if (next === previous) {
            return false;
        }
        if (next > getLevel(key)) {
            clearBranchTargets(item.branch.id);
            state.targets[key] = next;
            targetAncestors(item.branch, item.node, next);
        } else {
            if (previous > 0) {
                clearBranchTargets(item.branch.id);
            } else {
                delete state.targets[key];
            }
        }
        return true;
    }

    function normalizeTargetPrerequisites() {
        var changed = false;
        branches.forEach(function (branch) {
            branch.nodes.forEach(function (node) {
                var key = nodeKey(branch.id, node.id);
                var target = getTarget(key);
                if (target > getLevel(key)) {
                    changed = targetAncestors(branch, node, target) || changed;
                }
            });
        });
        return changed;
    }

    function completeAncestors(branch, node, level) {
        walkRequiredAncestors(branch, node, level || node.maxLevel, function (parent, requiredLevel) {
            var key = nodeKey(branch.id, parent.id);
            if (getLevel(key) < requiredLevel) {
                state.levels[key] = requiredLevel;
            }
            if (getTarget(key) <= requiredLevel) {
                delete state.targets[key];
            }
        });
    }

    function targetAncestors(branch, node, level) {
        var changed = false;
        walkRequiredAncestors(branch, node, level || node.maxLevel, function (parent, requiredLevel) {
            var key = nodeKey(branch.id, parent.id);
            if (getLevel(key) < requiredLevel && getTarget(key) < requiredLevel) {
                state.targets[key] = requiredLevel;
                changed = true;
            }
        });
        return changed;
    }

    function requiredParentLevel(branch, parent, childRequiredLevel) {
        return parent.maxLevel;
    }

    function walkRequiredAncestors(branch, node, level, callback) {
        var nodeMap = branchMaps.get(branch.id);
        var bestRequired = new Map();
        function visit(current, currentRequiredLevel) {
            (current.parents || []).forEach(function (parentId) {
                if (!nodeMap.has(parentId)) {
                    return;
                }
                var parent = nodeMap.get(parentId);
                var requiredLevel = requiredParentLevel(branch, parent, currentRequiredLevel);
                var previous = bestRequired.get(parentId) || 0;
                if (requiredLevel <= previous) {
                    return;
                }
                bestRequired.set(parentId, requiredLevel);
                callback(parent, requiredLevel);
                visit(parent, requiredLevel);
            });
        }
        visit(node, clampLevel(level, node.maxLevel));
    }

    function walkAncestors(branch, node, callback) {
        var nodeMap = branchMaps.get(branch.id);
        var seen = new Set();
        function visit(current) {
            (current.parents || []).forEach(function (parentId) {
                if (seen.has(parentId) || !nodeMap.has(parentId)) {
                    return;
                }
                seen.add(parentId);
                var parent = nodeMap.get(parentId);
                callback(parent);
                visit(parent);
            });
        }
        visit(node);
    }

    function clearBranch(branchId) {
        var branch = branchById.get(branchId);
        if (!branch) {
            return;
        }
        branch.nodes.forEach(function (node) {
            var key = nodeKey(branch.id, node.id);
            delete state.levels[key];
            delete state.targets[key];
        });
        if (state.selectedKey && state.selectedKey.indexOf(branch.id + ":") === 0) {
            state.selectedKey = null;
            closeDrawer();
        }
    }

    function clearBranchTargets(branchId) {
        var branch = branchById.get(branchId);
        var changed = false;
        if (!branch) {
            return false;
        }
        branch.nodes.forEach(function (node) {
            var key = nodeKey(branch.id, node.id);
            if (state.targets[key]) {
                delete state.targets[key];
                changed = true;
            }
        });
        return changed;
    }

    function calculateTotals(branchList) {
        var totals = {
            completedBadges: 0,
            plannedBadges: 0,
            remainingBadges: 0,
            completedLevels: 0,
            targetLevels: 0,
            totalLevels: 0
        };
        branchList.forEach(function (branch) {
            branch.nodes.forEach(function (node) {
                var key = nodeKey(branch.id, node.id);
                var done = getLevel(key);
                var target = getTarget(key);
                totals.completedBadges += costToLevel(node, done);
                totals.plannedBadges += target > done ? rangeCost(node, done, target) : 0;
                totals.remainingBadges += node.totalBadges - costToLevel(node, done);
                totals.completedLevels += done;
                totals.targetLevels += target > done ? target - done : 0;
                totals.totalLevels += node.maxLevel;
            });
        });
        return totals;
    }

    function dependencyWarnings(branch) {
        var messages = [];
        var keys = new Set();
        var nodeMap = branchMaps.get(branch.id);
        branch.nodes.forEach(function (node) {
            var key = nodeKey(branch.id, node.id);
            var done = getLevel(key);
            var target = getTarget(key);
            if (!node.parents || node.parents.length === 0 || (done === 0 && target === 0)) {
                return;
            }
            var missingCompleted = [];
            var requiredLevel = Math.max(done, target);
            node.parents.forEach(function (parentId) {
                var parent = nodeMap.get(parentId);
                if (!parent) {
                    return;
                }
                var parentKey = nodeKey(branch.id, parentId);
                var parentRequired = requiredParentLevel(branch, parent, requiredLevel);
                if (done > 0 && getLevel(parentKey) < parentRequired) {
                    missingCompleted.push(parent.name + " " + parentRequired + "/" + parent.maxLevel);
                }
            });
            if (missingCompleted.length) {
                keys.add(key);
                messages.push(node.name + " has completed levels but missing prerequisites: " + missingCompleted.join(", ") + ".");
            }
        });
        return { messages: messages, keys: keys };
    }

    function aggregateStats(branch) {
        var statsByKey = new Map();
        branch.nodes.forEach(function (node) {
            var done = getLevel(nodeKey(branch.id, node.id));
            (node.stats || []).forEach(function (stat) {
                if (!stat || String(stat.key).toLowerCase() === "power") {
                    return;
                }
                if (!statsByKey.has(stat.key)) {
                    statsByKey.set(stat.key, {
                        label: stat.label || stat.key,
                        format: stat.format || "number",
                        earned: 0,
                        target: 0,
                        total: 0
                    });
                }
                var item = statsByKey.get(stat.key);
                var key = nodeKey(branch.id, node.id);
                var target = Math.max(done, getTarget(key));
                item.total += Number(stat.values && stat.values[node.maxLevel - 1] || 0);
                item.earned += done > 0 ? Number(stat.values && stat.values[done - 1] || 0) : 0;
                item.target += target > 0 ? Number(stat.values && stat.values[target - 1] || 0) : 0;
            });
        });
        return Array.from(statsByKey.values()).sort(function (a, b) {
            var ar = a.total ? a.target / a.total : 0;
            var br = b.total ? b.target / b.total : 0;
            return br - ar || a.label.localeCompare(b.label);
        });
    }

    function treeLayout(branch) {
        var compact = isSmallScreen();
        if (compact) {
            return mobileTreeLayout(branch);
        }
        if (isTabletScreen()) {
            return tabletTreeLayout(branch);
        }
        var nodeWidth = 220;
        var nodeHeight = 196;
        var padding = 42;
        var xScale = 2.35;
        var yScale = 2.05;
        var xs = branch.nodes.map(function (node) { return node.position && Number(node.position.x) || 0; });
        var ys = branch.nodes.map(function (node) { return node.position && Number(node.position.y) || 0; });
        var minX = Math.min.apply(Math, xs);
        var minY = Math.min.apply(Math, ys);
        var maxX = Math.max.apply(Math, xs);
        var maxY = Math.max.apply(Math, ys);
        var points = new Map();
        branch.nodes.forEach(function (node) {
            points.set(node.id, {
                x: ((node.position && Number(node.position.x) || 0) - minX) * xScale + padding,
                y: ((node.position && Number(node.position.y) || 0) - minY) * yScale + padding
            });
        });
        return {
            nodeWidth: nodeWidth,
            nodeHeight: nodeHeight,
            width: (maxX - minX) * xScale + nodeWidth + padding * 2,
            height: (maxY - minY) * yScale + nodeHeight + padding * 2,
            points: points
        };
    }

    function tabletTreeLayout(branch) {
        var nodeWidth = 160;
        var nodeHeight = 160;
        var padding = 24;
        var minGap = 28;
        var rowGap = 190;
        var windowWidth = window.innerWidth || 820;
        var documentWidth = document.documentElement && document.documentElement.clientWidth ? document.documentElement.clientWidth : windowWidth;
        var viewWidth = refs.plannerView && refs.plannerView.clientWidth ? refs.plannerView.clientWidth : windowWidth;
        var viewportWidth = Math.max(620, Math.min(viewWidth, windowWidth, documentWidth));
        var width = Math.max(620, viewportWidth - 20);
        var rows = new Map();
        branch.nodes.forEach(function (node) {
            var y = node.position && Number(node.position.y) || 0;
            var rowKey = String(y);
            if (!rows.has(rowKey)) {
                rows.set(rowKey, { y: y, nodes: [] });
            }
            rows.get(rowKey).nodes.push(node);
        });
        var sortedRows = Array.from(rows.values()).sort(function (a, b) {
            return a.y - b.y;
        });
        sortedRows.forEach(function (row) {
            row.nodes.sort(function (a, b) {
                var ax = a.position && Number(a.position.x) || 0;
                var bx = b.position && Number(b.position.x) || 0;
                return ax - bx || a.name.localeCompare(b.name);
            });
            var needed = row.nodes.length * nodeWidth + Math.max(0, row.nodes.length - 1) * minGap + padding * 2;
            width = Math.max(width, needed);
        });
        var points = new Map();
        sortedRows.forEach(function (row, rowIndex) {
            var count = row.nodes.length;
            var usable = width - padding * 2 - nodeWidth;
            row.nodes.forEach(function (node, index) {
                var x = count === 1 ? (width - nodeWidth) / 2 : padding + (usable * index / (count - 1));
                points.set(node.id, {
                    x: Math.round(x),
                    y: padding + rowIndex * rowGap
                });
            });
        });
        return {
            nodeWidth: nodeWidth,
            nodeHeight: nodeHeight,
            width: width,
            height: padding * 2 + sortedRows.length * rowGap + nodeHeight - rowGap,
            points: points
        };
    }

    function mobileTreeLayout(branch) {
        var nodeWidth = 94;
        var nodeHeight = 128;
        var padding = 10;
        var minGap = 4;
        var rowGap = 136;
        var windowWidth = window.innerWidth || 390;
        var documentWidth = document.documentElement && document.documentElement.clientWidth ? document.documentElement.clientWidth : windowWidth;
        var visualWidth = window.visualViewport && window.visualViewport.width ? window.visualViewport.width : windowWidth;
        var viewWidth = refs.plannerView && refs.plannerView.clientWidth ? refs.plannerView.clientWidth : windowWidth;
        var viewportWidth = Math.max(300, Math.min(viewWidth, windowWidth, documentWidth, visualWidth));
        var width = Math.max(300, Math.min(340, viewportWidth - 22));
        var rows = new Map();
        branch.nodes.forEach(function (node) {
            var y = node.position && Number(node.position.y) || 0;
            var rowKey = String(y);
            if (!rows.has(rowKey)) {
                rows.set(rowKey, { y: y, nodes: [] });
            }
            rows.get(rowKey).nodes.push(node);
        });
        var sortedRows = Array.from(rows.values()).sort(function (a, b) {
            return a.y - b.y;
        });
        sortedRows.forEach(function (row) {
            row.nodes.sort(function (a, b) {
                var ax = a.position && Number(a.position.x) || 0;
                var bx = b.position && Number(b.position.x) || 0;
                return ax - bx || a.name.localeCompare(b.name);
            });
            var needed = row.nodes.length * nodeWidth + Math.max(0, row.nodes.length - 1) * minGap + padding * 2;
            width = Math.max(width, needed);
        });
        var points = new Map();
        sortedRows.forEach(function (row, rowIndex) {
            var count = row.nodes.length;
            var usable = width - padding * 2 - nodeWidth;
            row.nodes.forEach(function (node, index) {
                var x = count === 1 ? (width - nodeWidth) / 2 : padding + (usable * index / (count - 1));
                points.set(node.id, {
                    x: Math.round(x),
                    y: padding + rowIndex * rowGap
                });
            });
        });
        return {
            nodeWidth: nodeWidth,
            nodeHeight: nodeHeight,
            width: width,
            height: padding * 2 + sortedRows.length * rowGap + nodeHeight - rowGap,
            points: points
        };
    }

    function levelSelect(mode, key, value, maxLevel) {
        var options = [];
        for (var level = 0; level <= maxLevel; level += 1) {
            options.push('<option value="' + level + '"' + (level === value ? " selected" : "") + ">" + level + "</option>");
        }
        return '<select data-level-select="' + mode + '" data-key="' + escapeAttr(key) + '">' + options.join("") + "</select>";
    }

    function miniButton(action, key, label) {
        return '<button type="button" class="mini-button" data-action="' + action + '" data-key="' + escapeAttr(key) + '">' + escapeHtml(label) + "</button>";
    }

    function branchStat(label, value, note) {
        return [
            '<div class="branch-stat">',
            "<span>", escapeHtml(label), "</span>",
            "<strong>", escapeHtml(value), "</strong>",
            "<small>", escapeHtml(note), "</small>",
            "</div>"
        ].join("");
    }

    function nodeStats(node) {
        return (node.stats || []).filter(function (stat) {
            return stat && Array.isArray(stat.values) && stat.values.length && String(stat.key).toLowerCase() !== "power";
        }).slice(0, 4);
    }

    function getLevel(key) {
        var item = nodeByKey.get(key);
        return item ? clampLevel(Number(state.levels[key] || 0), item.node.maxLevel) : 0;
    }

    function getTarget(key) {
        var item = nodeByKey.get(key);
        return item ? clampLevel(Number(state.targets[key] || 0), item.node.maxLevel) : 0;
    }

    function costToLevel(node, level) {
        return rangeCost(node, 0, clampLevel(level, node.maxLevel));
    }

    function rangeCost(node, fromLevel, toLevel) {
        var from = clampLevel(fromLevel, node.maxLevel);
        var to = clampLevel(toLevel, node.maxLevel);
        if (to <= from) {
            return 0;
        }
        return node.badgeCost.slice(from, to).reduce(function (sum, cost) {
            return sum + Number(cost || 0);
        }, 0);
    }

    function copyShareLink() {
        var payload = {
            v: 2,
            b: state.activeBranchId,
            view: state.view,
            a: state.autoParents ? 1 : 0,
            s: state.statsOpen ? 1 : 0,
            l: levelMapToArray(state.levels),
            t: levelMapToArray(state.targets)
        };
        var url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("p", base64UrlEncode(JSON.stringify(payload)));
        var link = url.toString();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(function () {
                setStatus("Share link copied.");
            }).catch(function () {
                fallbackCopy(link);
            });
        } else {
            fallbackCopy(link);
        }
    }

    function fallbackCopy(link) {
        window.prompt("Copy share link:", link);
        setStatus("Share link ready.");
    }

    function closeDrawer() {
        state.selectedKey = null;
        refs.drawer.hidden = true;
        refs.drawerContent.innerHTML = "";
    }

    function readJsonStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || "null");
        } catch (error) {
            localStorage.removeItem(key);
            return null;
        }
    }

    function migrateLegacyMap(value, targetName) {
        if (!value || typeof value !== "object") {
            return;
        }
        Object.keys(value).forEach(function (key) {
            var item = nodeByKey.get(key);
            if (value[key] && item) {
                state[targetName][key] = item.node.maxLevel;
            }
        });
    }

    function cleanLevelMap(value) {
        var out = {};
        if (!value || typeof value !== "object") {
            return out;
        }
        Object.keys(value).forEach(function (key) {
            var item = nodeByKey.get(key);
            var level = item ? clampLevel(Number(value[key] || 0), item.node.maxLevel) : 0;
            if (level > 0) {
                out[key] = level;
            }
        });
        return out;
    }

    function levelMapToArray(map) {
        return Object.keys(map).filter(function (key) {
            return nodeByKey.has(key) && Number(map[key] || 0) > 0;
        }).sort().map(function (key) {
            var split = key.indexOf(":");
            return [key.slice(0, split), key.slice(split + 1), Number(map[key])];
        });
    }

    function arrayToLevelMap(value) {
        var out = {};
        if (!Array.isArray(value)) {
            return out;
        }
        value.forEach(function (row) {
            if (!Array.isArray(row) || row.length < 3) {
                return;
            }
            var key = nodeKey(row[0], row[1]);
            var item = nodeByKey.get(key);
            var level = item ? clampLevel(Number(row[2] || 0), item.node.maxLevel) : 0;
            if (level > 0) {
                out[key] = level;
            }
        });
        return out;
    }

    function arrayToBooleanMap(value) {
        var out = {};
        if (Array.isArray(value)) {
            value.forEach(function (key) {
                out[key] = true;
            });
        }
        return out;
    }

    function nodeKey(branchId, nodeId) {
        return branchId + ":" + nodeId;
    }

    function findNodeName(branch, nodeId) {
        var nodeMap = branchMaps.get(branch.id);
        return nodeMap && nodeMap.has(nodeId) ? nodeMap.get(nodeId).name : nodeId;
    }

    function initials(name) {
        return String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
            return part.charAt(0).toUpperCase();
        }).join("");
    }

    function clampLevel(value, maxLevel) {
        return Math.max(0, Math.min(Number(maxLevel || 0), Math.round(Number(value || 0))));
    }

    function isSmallScreen() {
        return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
    }

    function isTabletScreen() {
        return window.matchMedia && window.matchMedia("(max-width: 980px)").matches;
    }

    function formatNumber(value) {
        return Number(value || 0).toLocaleString(plannerLocale.numberLocale);
    }

    function formatStat(value, format) {
        var number = Number(value || 0);
        if (format === "percent") {
            return formatNumber(number) + "%";
        }
        return formatNumber(number);
    }

    function detectPlannerLocale() {
        var localeMap = {
            "fr": { code: "fr", numberLocale: "fr-FR" },
            "de": { code: "de", numberLocale: "de-DE" },
            "es": { code: "es", numberLocale: "es-ES" },
            "id": { code: "id", numberLocale: "id-ID" },
            "pt-br": { code: "pt-BR", numberLocale: "pt-BR" },
            "vi": { code: "vi", numberLocale: "vi-VN" },
            "ar": { code: "ar", numberLocale: "ar" }
        };
        var firstSegment = window.location.pathname.split("/").filter(Boolean)[0] || "";
        return localeMap[firstSegment.toLowerCase()] || { code: "en", numberLocale: "en-US" };
    }

    function setStatus(message) {
        refs.shareStatus.textContent = message;
        window.clearTimeout(setStatus.timer);
        setStatus.timer = window.setTimeout(function () {
            refs.shareStatus.textContent = "";
        }, 3000);
    }

    function base64UrlEncode(value) {
        return btoa(unescape(encodeURIComponent(value)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
    }

    function base64UrlDecode(value) {
        var padded = value.replace(/-/g, "+").replace(/_/g, "/");
        while (padded.length % 4) {
            padded += "=";
        }
        return decodeURIComponent(escape(atob(padded)));
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }
}());
