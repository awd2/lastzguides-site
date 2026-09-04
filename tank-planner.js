(function () {
    "use strict";

    var data = window.LastZTankPlannerData;
    var root = document.getElementById("tank-planner");
    if (!data || !root || !Array.isArray(data.modifications)) {
        return;
    }

    var STORAGE_KEY = "lastz:tank-planner:v2";
    var LEGACY_STORAGE_KEY = "lastz:tank-planner:v1";
    var formatter = new Intl.NumberFormat("en-US");
    var progress = data.modifications.map(function () { return 0; });
    var goalIndex = -1;
    var goalSublevel = 0;
    var view = "path";
    var expandedIndex = -1;
    var lastTrigger = null;
    var loadedFromShare = false;
    var entryMode = "new";
    var meaningfulUseTracked = false;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

    var elements = {
        pathView: root.querySelector("[data-path-view]"),
        tableView: root.querySelector("[data-table-view]"),
        tableBody: root.querySelector("[data-table-body]"),
        milestones: root.querySelector("[data-milestones]"),
        spent: root.querySelector("[data-summary-spent]"),
        remaining: root.querySelector("[data-summary-remaining]"),
        toGoal: root.querySelector("[data-summary-to-goal]"),
        goalCard: root.querySelector("[data-summary-goal-card]"),
        dashboard: root.querySelector(".tank-dashboard"),
        currentModification: root.querySelector("[data-current-modification]"),
        currentSublevel: root.querySelector("[data-current-sublevel]"),
        goalModification: root.querySelector("[data-goal-modification]"),
        goalSublevel: root.querySelector("[data-goal-sublevel]"),
        status: root.querySelector("[data-status]")
    };

    var resetDialog = document.querySelector("[data-reset-dialog]");

    function formatNumber(value) {
        return formatter.format(Math.round(value));
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
        });
    }

    function clamp(value, minimum, maximum) {
        return Math.min(Math.max(Number(value) || 0, minimum), maximum);
    }

    function ratedPerSub(modification) {
        return modification.ratedCost / modification.sublevels;
    }

    function normalizeProgress(values) {
        var normalized = data.modifications.map(function (modification, index) {
            return Math.round(clamp(Array.isArray(values) ? values[index] : 0, 0, modification.sublevels));
        });
        var frontier = normalized.reduce(function (last, value, index) { return value > 0 ? index : last; }, -1);
        if (frontier < 0) {
            return normalized.map(function () { return 0; });
        }
        return normalized.map(function (value, index) {
            if (index < frontier) {
                return data.modifications[index].sublevels;
            }
            return index === frontier ? value : 0;
        });
    }

    function currentIndex() {
        return progress.reduce(function (last, value, index) { return value > 0 ? index : last; }, -1);
    }

    function encodeProgress(values) {
        var frontier = values.reduce(function (last, value, index) { return value > 0 ? index : last; }, -1);
        return frontier < 0 ? "" : values.slice(0, frontier + 1).map(function (value) { return value.toString(36); }).join(".");
    }

    function decodeProgress(value) {
        if (!value || !/^[0-9a-z.]+$/i.test(value)) {
            return null;
        }
        var values = value.split(".").map(function (part) { return parseInt(part, 36); });
        return values.some(function (part) { return !Number.isFinite(part); }) ? null : normalizeProgress(values);
    }

    function encodeGoal() {
        return goalIndex >= 0 ? goalIndex.toString(36) + "." + goalSublevel.toString(36) : "";
    }

    function decodeGoal(value) {
        var match = /^([0-9a-z]+)\.([0-9a-z]+)$/i.exec(value || "");
        if (!match) {
            return null;
        }
        var index = parseInt(match[1], 36);
        var sublevel = parseInt(match[2], 36);
        if (!data.modifications[index] || !Number.isFinite(sublevel)) {
            return null;
        }
        return { index: index, sublevel: Math.round(clamp(sublevel, 1, data.modifications[index].sublevels)) };
    }

    function loadState() {
        var parameters = new URLSearchParams(window.location.search);
        var sharedProgress = decodeProgress(parameters.get("tank"));
        var sharedGoal = decodeGoal(parameters.get("goal"));
        var hasSharedState = Boolean(sharedProgress || sharedGoal);
        if (hasSharedState) {
            progress = sharedProgress || progress;
            if (sharedGoal) {
                goalIndex = sharedGoal.index;
                goalSublevel = sharedGoal.sublevel;
            }
            loadedFromShare = true;
            entryMode = "shared";
            saveState();
            return;
        }
        try {
            var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
            if (saved && (saved.version === 1 || saved.version === 2)) {
                progress = normalizeProgress(saved.progress);
                if (saved.version === 2 && data.modifications[saved.goalIndex]) {
                    goalIndex = Number(saved.goalIndex);
                    goalSublevel = Math.round(clamp(saved.goalSublevel, 1, data.modifications[goalIndex].sublevels));
                }
                if (hasUsefulState()) entryMode = "saved";
                saveState();
            }
        } catch (error) {
            progress = normalizeProgress([]);
            goalIndex = -1;
            goalSublevel = 0;
        }
    }

    function saveState() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, progress: progress, goalIndex: goalIndex, goalSublevel: goalSublevel }));
            return true;
        } catch (error) {
            setStatus("Progress could not be saved in this browser.");
            return false;
        }
    }

    function setStatus(message) {
        elements.status.textContent = message;
        window.clearTimeout(setStatus.timeout);
        setStatus.timeout = window.setTimeout(function () {
            if (elements.status.textContent === message) {
                elements.status.textContent = "";
            }
        }, 5000);
    }

    function track(action) {
        if (!window.analytics || typeof window.analytics.trackEvent !== "function") return;
        window.analytics.trackEvent("planner_use", {
            planner_id: "tank-planner",
            action: action,
            entry_mode: entryMode
        });
    }

    function hasUsefulState() {
        return goalIndex >= 0 || progress.some(function (value) { return value > 0; });
    }

    function trackMeaningfulUse(persisted) {
        if (!persisted || meaningfulUseTracked || !hasUsefulState()) return;
        meaningfulUseTracked = true;
        track("meaningful_use");
    }

    function costThrough(index, sublevel) {
        if (index < 0) {
            return 0;
        }
        return data.modifications.reduce(function (sum, modification, itemIndex) {
            if (itemIndex < index) {
                return sum + modification.ratedCost;
            }
            return itemIndex === index ? sum + ratedPerSub(modification) * sublevel : sum;
        }, 0);
    }

    function totals() {
        var spent = data.modifications.reduce(function (sum, modification, index) {
            return sum + progress[index] * ratedPerSub(modification);
        }, 0);
        var goalCost = goalIndex >= 0 ? costThrough(goalIndex, goalSublevel) : null;
        return { spent: spent, remaining: Math.max(data.totalRatedWrenches - spent, 0), toGoal: goalCost === null ? null : Math.max(goalCost - spent, 0) };
    }

    function setProgress(index, value) {
        if (index < 0 || !data.modifications[index]) {
            progress = data.modifications.map(function () { return 0; });
            return;
        }
        progress = data.modifications.map(function (modification, itemIndex) {
            if (itemIndex < index) {
                return modification.sublevels;
            }
            return itemIndex === index ? Math.round(clamp(value, 0, modification.sublevels)) : 0;
        });
        progress = normalizeProgress(progress);
    }

    function setGoal(index, sublevel) {
        if (index < 0 || !data.modifications[index]) {
            goalIndex = -1;
            goalSublevel = 0;
            return;
        }
        goalIndex = index;
        goalSublevel = Math.round(clamp(sublevel, 1, data.modifications[index].sublevels));
    }

    function modificationOptions(selectedIndex, emptyLabel) {
        return '<option value="-1">' + escapeHtml(emptyLabel) + '</option>' + data.modifications.map(function (modification, index) {
            var milestone = data.milestones.some(function (item) { return item.level === modification.level; });
            return '<option value="' + index + '"' + (index === selectedIndex ? " selected" : "") + '>Lv. ' + modification.level + " — " + escapeHtml(modification.name) + (milestone ? " · milestone" : "") + "</option>";
        }).join("");
    }

    function sublevelOptions(modification, selected, includeEmpty) {
        if (!modification) {
            return '<option value="0">—</option>';
        }
        var options = includeEmpty ? '<option value="0">No goal</option>' : "";
        return options + Array.from({ length: modification.sublevels }, function (_, index) {
            var value = index + 1;
            return '<option value="' + value + '"' + (value === selected ? " selected" : "") + ">" + value + "/" + modification.sublevels + "</option>";
        }).join("");
    }

    function renderSelectors() {
        var frontier = currentIndex();
        elements.currentModification.innerHTML = modificationOptions(frontier, "No progress");
        elements.currentSublevel.innerHTML = sublevelOptions(data.modifications[frontier], frontier >= 0 ? progress[frontier] : 0, false);
        elements.currentSublevel.disabled = frontier < 0;
        elements.goalModification.innerHTML = modificationOptions(goalIndex, "No goal");
        elements.goalSublevel.innerHTML = sublevelOptions(data.modifications[goalIndex], goalSublevel, true);
        elements.goalSublevel.disabled = goalIndex < 0;
    }

    function nodeControlsMarkup(modification, index, current) {
        return '<div class="tank-node-detail">' +
            '<div class="tank-node-stepper" role="group" aria-label="' + escapeHtml(modification.name) + ' current sub-level"><button type="button" data-action="decrement" data-index="' + index + '" aria-label="Decrease ' + escapeHtml(modification.name) + ' progress"' + (current <= 0 ? " disabled" : "") + '>−</button><output>' + current + "/" + modification.sublevels + '</output><button type="button" data-action="increment" data-index="' + index + '" aria-label="Increase ' + escapeHtml(modification.name) + ' progress"' + (current >= modification.sublevels ? " disabled" : "") + '>+</button></div></div>';
    }

    function pathNodeMarkup(modification, index) {
        var current = progress[index];
        var complete = current === modification.sublevels;
        var isCurrent = index === currentIndex();
        var isGoal = index === goalIndex;
        var isExpanded = index === expandedIndex;
        var remaining = (modification.sublevels - current) * ratedPerSub(modification);
        var milestone = data.milestones.find(function (item) { return item.level === modification.level; });
        return '<article class="tank-path-node' + (complete ? " is-complete" : "") + (isCurrent ? " is-current" : "") + (isGoal ? " has-goal" : "") + '" id="' + modification.id + '">' +
            '<div class="tank-node-row"><button type="button" class="tank-node-summary" data-action="toggle-node" data-index="' + index + '" aria-expanded="' + isExpanded + '"><span class="tank-node-heading"><span class="tank-node-level">Lv. ' + modification.level + (milestone ? " · Milestone" : "") + '</span><strong>' + escapeHtml(modification.name) + '</strong><small>' + escapeHtml(modification.rating) + '</small></span><span class="tank-node-state"><strong>' + current + "/" + modification.sublevels + '</strong><small>' + formatNumber(remaining) + ' left</small></span><span class="tank-node-chevron" aria-hidden="true"></span></button>' +
            '<button type="button" class="tank-node-quick tank-node-done" data-action="toggle-done" data-index="' + index + '" aria-pressed="' + complete + '" aria-label="Mark ' + escapeHtml(modification.name) + (complete ? ' not done' : ' done') + '"><span class="tank-node-done-icon" aria-hidden="true"></span><span>Done</span></button>' +
            '<button type="button" class="tank-node-quick tank-node-goal" data-action="toggle-goal" data-index="' + index + '" aria-pressed="' + isGoal + '" aria-label="' + (isGoal ? 'Clear goal for ' : 'Set goal for ') + escapeHtml(modification.name) + '"><span class="tank-node-goal-icon" aria-hidden="true"></span><span>Goal</span></button></div>' +
            '<div class="tank-node-progress" aria-hidden="true"><span style="width:' + (current / modification.sublevels * 100) + '%"></span></div>' +
            (isExpanded ? nodeControlsMarkup(modification, index, current) : "") + '</article>';
    }

    function pathMarkup() {
        var groupStarts = { 0: "To Cheetah", 10: "To Hercules", 20: "To Destroyer", 30: "To Destroyer EX", 40: "To Full Path" };
        return data.modifications.map(function (modification, index) {
            return (groupStarts[index] ? '<h3 class="tank-path-group">' + groupStarts[index] + '</h3>' : "") + pathNodeMarkup(modification, index);
        }).join("");
    }

    function rowSelect(type, index, current, maximum) {
        return '<select data-row-' + type + ' data-index="' + index + '" aria-label="' + (type === "current" ? "Current" : "Goal") + ' sub-level for ' + escapeHtml(data.modifications[index].name) + '">' + Array.from({ length: maximum + 1 }, function (_, value) {
            return '<option value="' + value + '"' + (value === current ? " selected" : "") + ">" + value + "/" + maximum + "</option>";
        }).join("") + "</select>";
    }

    function tableRowMarkup(modification, index) {
        var current = progress[index];
        var target = index === goalIndex ? goalSublevel : 0;
        var remaining = (modification.sublevels - current) * ratedPerSub(modification);
        var isExpanded = index === expandedIndex;
        return '<tr class="tank-table-row ' + (current === modification.sublevels ? "is-complete " : "") + (index === goalIndex ? "has-goal" : "") + '" id="table-' + modification.id + '"><td><button type="button" data-action="toggle-table" data-index="' + index + '" aria-expanded="' + isExpanded + '"><strong>' + escapeHtml(modification.name) + '</strong><small>' + escapeHtml(modification.rating) + '</small></button></td><td>' + modification.level + '</td><td>' + current + "/" + modification.sublevels + '</td><td>' + formatNumber(remaining) + '</td></tr>' + (isExpanded ? '<tr class="tank-table-detail"><td colspan="4"><div><label><span>Current</span>' + rowSelect("current", index, current, modification.sublevels) + '</label><label><span>Goal</span>' + rowSelect("goal", index, target, modification.sublevels) + '</label></div></td></tr>' : "");
    }

    function milestoneMarkup(milestone, spent) {
        var index = data.modifications.findIndex(function (item) { return item.level === milestone.level; });
        var active = index === goalIndex && goalSublevel === data.modifications[index].sublevels;
        var remaining = Math.max(milestone.ratedWrenches - spent, 0);
        var label = milestone.name === "Cheetah Armored Vehicle" ? "Cheetah" : milestone.name;
        return '<button type="button" data-action="milestone" data-index="' + index + '" class="' + (remaining === 0 ? "is-reached " : "") + (active ? "is-goal" : "") + '" aria-pressed="' + active + '"><span>' + escapeHtml(label) + '<small>Lv. ' + milestone.level + '</small></span><strong>' + (active ? "Goal" : remaining === 0 ? "Reached" : formatNumber(remaining)) + '<small>' + (active ? formatNumber(remaining) + " left" : remaining === 0 ? formatNumber(milestone.ratedWrenches) + " spent" : "left") + '</small></strong></button>';
    }

    function restoreFocus(focus) {
        if (!focus) {
            return;
        }
        var target = focus.selector ? root.querySelector(focus.selector) : root.querySelector('[data-action="' + focus.action + '"][data-index="' + focus.index + '"]');
        if (target && target.disabled && focus.fallbackAction) {
            target = root.querySelector('[data-action="' + focus.fallbackAction + '"][data-index="' + focus.index + '"]');
        }
        if (target && !target.disabled && typeof target.focus === "function") {
            target.focus({ preventScroll: true });
        }
    }

    function render(focus) {
        var summary = totals();
        elements.spent.textContent = formatNumber(summary.spent);
        elements.remaining.textContent = formatNumber(summary.remaining);
        elements.toGoal.textContent = summary.toGoal === null ? "—" : formatNumber(summary.toGoal);
        elements.goalCard.hidden = goalIndex < 0;
        elements.dashboard.classList.toggle("has-goal", goalIndex >= 0);
        renderSelectors();
        elements.pathView.innerHTML = pathMarkup();
        elements.tableBody.innerHTML = data.modifications.map(tableRowMarkup).join("");
        elements.milestones.innerHTML = data.milestones.map(function (milestone) { return milestoneMarkup(milestone, summary.spent); }).join("");
        setView(view, false);
        restoreFocus(focus);
    }

    function updateProgress(index, value, action, focus) {
        setProgress(index, value);
        expandedIndex = index;
        var persisted = saveState();
        render(focus || null);
        trackMeaningfulUse(persisted);
    }

    function updateGoal(index, sublevel, action, focus) {
        setGoal(index, sublevel);
        var persisted = saveState();
        render(focus || null);
        trackMeaningfulUse(persisted);
    }

    function scrollToNode(index, instant) {
        var prefix = view === "table" ? "table-" : "";
        var target = document.getElementById(prefix + data.modifications[index].id);
        if (target) {
            target.scrollIntoView({ behavior: instant || (reduceMotion && reduceMotion.matches) ? "auto" : "smooth", block: "center" });
        }
    }

    function handleClick(event) {
        var control = event.target.closest("[data-action]");
        if (!control) {
            return;
        }
        var action = control.dataset.action;
        var index = Number(control.dataset.index);
        var modification = data.modifications[index];
        if (!modification) {
            return;
        }
        if (action === "increment") {
            updateProgress(index, progress[index] + 1, "increment_sublevel", { action: action, fallbackAction: "decrement", index: index });
        } else if (action === "decrement") {
            updateProgress(index, progress[index] - 1, "decrement_sublevel", { action: action, fallbackAction: "increment", index: index });
        } else if (action === "toggle-done") {
            var wasComplete = progress[index] === modification.sublevels;
            var previousIndex = index - 1;
            setProgress(wasComplete ? previousIndex : index, wasComplete && previousIndex >= 0 ? data.modifications[previousIndex].sublevels : modification.sublevels);
            expandedIndex = -1;
            var persisted = saveState();
            render({ action: action, index: index });
            trackMeaningfulUse(persisted);
        } else if (action === "toggle-goal") {
            updateGoal(index === goalIndex ? -1 : index, modification.sublevels, index === goalIndex ? "clear_goal" : "set_goal", { action: action, index: index });
        } else if (action === "toggle-node" || action === "toggle-table") {
            expandedIndex = expandedIndex === index ? -1 : index;
            render({ selector: '[data-action="' + action + '"][data-index="' + index + '"]' });
        } else if (action === "milestone") {
            setGoal(index, modification.sublevels);
            expandedIndex = index;
            view = "path";
            var milestonePersisted = saveState();
            render({ selector: '.tank-milestone-list [data-action="milestone"][data-index="' + index + '"]' });
            scrollToNode(index);
            trackMeaningfulUse(milestonePersisted);
        }
    }

    function handleChange(event) {
        var control = event.target;
        if (control.matches("[data-current-modification]")) {
            var current = Number(control.value);
            if (current < 0) {
                progress = data.modifications.map(function () { return 0; });
                saveState();
                render({ selector: "[data-current-modification]" });
            } else {
                updateProgress(current, data.modifications[current].sublevels, "set_current_position", { selector: "[data-current-sublevel]" });
            }
        } else if (control.matches("[data-current-sublevel]")) {
            var frontier = currentIndex();
            if (frontier >= 0) {
                updateProgress(frontier, Number(control.value), "set_current_sublevel", { selector: "[data-current-sublevel]" });
            }
        } else if (control.matches("[data-goal-modification]")) {
            var selectedGoal = Number(control.value);
            updateGoal(selectedGoal, selectedGoal >= 0 ? data.modifications[selectedGoal].sublevels : 0, selectedGoal >= 0 ? "set_goal" : "clear_goal", { selector: selectedGoal >= 0 ? "[data-goal-sublevel]" : "[data-goal-modification]" });
        } else if (control.matches("[data-goal-sublevel]")) {
            var value = Number(control.value);
            updateGoal(value > 0 ? goalIndex : -1, value, value > 0 ? "set_goal_sublevel" : "clear_goal", { selector: value > 0 ? "[data-goal-sublevel]" : "[data-goal-modification]" });
        } else if (control.matches("[data-row-current]")) {
            var rowCurrentIndex = Number(control.dataset.index);
            updateProgress(rowCurrentIndex, Number(control.value), "set_table_current", { selector: '[data-row-current][data-index="' + rowCurrentIndex + '"]' });
        } else if (control.matches("[data-row-goal]")) {
            var rowIndex = Number(control.dataset.index);
            var rowValue = Number(control.value);
            updateGoal(rowValue > 0 ? rowIndex : -1, rowValue, rowValue > 0 ? "set_table_goal" : "clear_goal", { selector: '[data-row-goal][data-index="' + rowIndex + '"]' });
        }
    }

    function sharePlan() {
        var url = new URL(window.location.href);
        var encodedProgress = encodeProgress(progress);
        var encodedGoal = encodeGoal();
        url.search = "";
        if (encodedProgress) {
            url.searchParams.set("tank", encodedProgress);
        }
        if (encodedGoal) {
            url.searchParams.set("goal", encodedGoal);
        }
        var fallback = function () {
            window.history.replaceState(null, "", url);
            setStatus("Copy the address bar URL to share this plan.");
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url.toString()).then(function () {
                window.history.replaceState(null, "", url);
                setStatus("Plan link copied.");
                if (hasUsefulState()) track("share_success");
            }).catch(fallback);
        } else {
            fallback();
        }
    }

    function resetPlanner() {
        progress = data.modifications.map(function () { return 0; });
        setGoal(-1, 0);
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        var url = new URL(window.location.href);
        ["tank", "goal", "start"].forEach(function (parameter) { url.searchParams.delete(parameter); });
        window.history.replaceState(null, "", url);
        closeDialog(resetDialog);
        render();
        setStatus("Tank Planner reset.");
    }

    function setView(nextView, shouldTrack) {
        view = nextView === "table" ? "table" : "path";
        elements.pathView.hidden = view !== "path";
        elements.tableView.hidden = view !== "table";
        root.querySelectorAll("[data-view]").forEach(function (button) {
            var active = button.dataset.view === view;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function openDialog(dialog, trigger) {
        lastTrigger = trigger || document.activeElement;
        document.body.classList.add("tank-dialog-open");
        dialog.showModal();
        var focusTarget = dialog.querySelector(".tank-dialog-close, input, button");
        if (focusTarget) {
            focusTarget.focus();
        }
    }

    function closeDialog(dialog) {
        if (dialog.open) {
            dialog.close();
        }
    }

    function attachDialogBehavior(dialog) {
        dialog.querySelectorAll("[data-close-dialog]").forEach(function (button) {
            button.addEventListener("click", function () { closeDialog(dialog); });
        });
        dialog.addEventListener("close", function () {
            if (!document.querySelector("dialog[open]")) {
                document.body.classList.remove("tank-dialog-open");
            }
            if (lastTrigger && lastTrigger.isConnected && typeof lastTrigger.focus === "function") {
                lastTrigger.focus();
            }
        });
        dialog.addEventListener("click", function (event) {
            if (event.target === dialog) {
                closeDialog(dialog);
            }
        });
    }

    loadState();
    render();
    root.addEventListener("click", handleClick);
    root.addEventListener("change", handleChange);
    root.querySelectorAll("[data-view]").forEach(function (button) {
        button.addEventListener("click", function () { setView(button.dataset.view); });
    });
    root.querySelector("[data-share]").addEventListener("click", sharePlan);
    root.querySelector("[data-open-reset]").addEventListener("click", function (event) {
        openDialog(resetDialog, event.currentTarget);
    });
    resetDialog.querySelector("[data-confirm-reset]").addEventListener("click", resetPlanner);
    attachDialogBehavior(resetDialog);

    if (loadedFromShare) {
        setStatus("Shared plan loaded.");
    }
    var frontier = currentIndex();
    if (frontier >= 0) {
        window.addEventListener("load", function () {
            window.setTimeout(function () {
                var target = document.getElementById(data.modifications[frontier].id);
                if (target) {
                    var top = target.getBoundingClientRect().top + window.scrollY - (window.innerHeight - target.offsetHeight) / 2;
                    window.scrollTo({ top: Math.max(top, 0), behavior: "auto" });
                }
            }, 250);
        });
    }
}());
