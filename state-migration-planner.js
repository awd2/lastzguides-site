(function () {
    "use strict";

    var STORAGE_KEY = "lastz.migrationPlanner.v1";
    var SCHEMA_VERSION = 1;
    var MAX_APPLICANTS = 500;
    var MAX_IMPORT_BYTES = 1024 * 1024;
    var TIERS = ["Regular", "Medium", "Advanced", "Elite"];
    var STANDARD_QUOTAS = {Regular: 60, Medium: 40, Advanced: 5, Elite: 1};
    var STATUSES = [
        "New",
        "Contacted",
        "Waiting for Score",
        "Tier Confirmed",
        "Slot Reserved",
        "Invited",
        "Application Sent",
        "Accepted",
        "Backup",
        "Rejected",
        "Migrated"
    ];
    var SLOT_STATUSES = ["Slot Reserved", "Invited", "Application Sent", "Accepted", "Migrated"];
    var PASS_WARNING_STATUSES = ["Slot Reserved", "Invited", "Application Sent", "Accepted", "Migrated"];
    var EDITING_ID = null;

    var root = document.querySelector("#migration-planner");
    if (!root) {
        return;
    }

    var refs = {
        boardName: root.querySelector("[data-board-name]"),
        destinationState: root.querySelector("[data-destination-state]"),
        saveState: root.querySelector("[data-save-state]"),
        slotSummary: root.querySelector("[data-slot-summary]"),
        boardAlerts: root.querySelector("[data-board-alerts]"),
        form: root.querySelector("[data-candidate-form]"),
        formTitle: root.querySelector("[data-form-title]"),
        submitCandidate: root.querySelector("[data-submit-candidate]"),
        cancelEdit: root.querySelector("[data-cancel-edit]"),
        formMessage: root.querySelector("[data-form-message]"),
        applicantCount: root.querySelector("[data-applicant-count]"),
        rows: root.querySelector("[data-applicant-rows]"),
        emptyState: root.querySelector("[data-empty-state]"),
        boardStatus: root.querySelector("[data-board-status]"),
        filterSearch: root.querySelector("[data-filter-search]"),
        filterTier: root.querySelector("[data-filter-tier]"),
        filterStatus: root.querySelector("[data-filter-status]"),
        filterAlliance: root.querySelector("[data-filter-alliance]"),
        copySummary: root.querySelector("[data-copy-summary]"),
        exportCsv: root.querySelector("[data-export-csv]"),
        exportJson: root.querySelector("[data-export-json]"),
        importJson: root.querySelector("[data-import-json]"),
        clearBoard: root.querySelector("[data-clear-board]")
    };

    var state = loadState();
    syncSetupInputs();
    bindEvents();
    render();

    if (state.applicants.length) {
        track("resume");
    } else {
        track("planner_ready");
    }

    function defaultState() {
        return {
            version: SCHEMA_VERSION,
            board: {
                name: "",
                destinationState: "",
                quotas: {
                    Regular: STANDARD_QUOTAS.Regular,
                    Medium: STANDARD_QUOTAS.Medium,
                    Advanced: STANDARD_QUOTAS.Advanced,
                    Elite: STANDARD_QUOTAS.Elite
                }
            },
            applicants: []
        };
    }

    function loadState() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return defaultState();
            }
            return sanitizeState(JSON.parse(raw));
        } catch (error) {
            setSaveState("Local save unavailable", true);
            return defaultState();
        }
    }

    function sanitizeState(value) {
        if (!value || typeof value !== "object" || value.version !== SCHEMA_VERSION) {
            throw new Error("Unsupported planner file");
        }
        var clean = defaultState();
        var board = value.board && typeof value.board === "object" ? value.board : {};
        clean.board.name = cleanText(board.name, 80);
        clean.board.destinationState = cleanText(board.destinationState, 40);
        TIERS.forEach(function (tier) {
            clean.board.quotas[tier] = STANDARD_QUOTAS[tier];
        });
        var applicants = Array.isArray(value.applicants) ? value.applicants.slice(0, MAX_APPLICANTS) : [];
        clean.applicants = applicants.map(sanitizeApplicant).filter(function (applicant) {
            return applicant.playerName.length > 0;
        });
        return clean;
    }

    function sanitizeApplicant(value) {
        var applicant = value && typeof value === "object" ? value : {};
        var tier = applicant.tier === "Unknown" || TIERS.indexOf(applicant.tier) !== -1 ? applicant.tier : "Unknown";
        var status = STATUSES.indexOf(applicant.status) !== -1 ? applicant.status : "New";
        var score = cleanText(applicant.migrationScore, 24);
        if (score && (!/^\d+$/.test(score) || Number(score) < 0)) {
            score = "";
        }
        return {
            id: cleanText(applicant.id, 100) || createId(),
            playerName: cleanText(applicant.playerName, 80),
            currentState: cleanText(applicant.currentState, 40),
            tier: tier,
            migrationScore: score,
            passesReady: applicant.passesReady === true,
            targetAlliance: cleanText(applicant.targetAlliance, 80),
            groupName: cleanText(applicant.groupName, 80),
            languageTimeZone: cleanText(applicant.languageTimeZone, 80),
            coordinator: cleanText(applicant.coordinator, 80),
            status: status,
            notes: cleanText(applicant.notes, 600)
        };
    }

    function cleanText(value, maxLength) {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value).trim().slice(0, maxLength);
    }

    function saveState(message) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            setSaveState(message || "Saved locally", false);
            return true;
        } catch (error) {
            setSaveState("Local save unavailable", true);
            return false;
        }
    }

    function setSaveState(message, isError) {
        if (!refs || !refs.saveState) {
            return;
        }
        refs.saveState.textContent = message;
        refs.saveState.classList.toggle("is-error", isError);
        refs.saveState.style.borderColor = isError ? "rgba(238, 102, 102, 0.55)" : "";
        refs.saveState.style.color = isError ? "#ffb9b9" : "";
    }

    function bindEvents() {
        refs.boardName.addEventListener("input", function () {
            state.board.name = cleanText(refs.boardName.value, 80);
            saveState();
        });
        refs.destinationState.addEventListener("input", function () {
            state.board.destinationState = cleanText(refs.destinationState.value, 40);
            saveState();
        });
        refs.form.addEventListener("submit", submitApplicant);
        refs.cancelEdit.addEventListener("click", resetForm);
        refs.rows.addEventListener("click", handleRowAction);
        refs.filterSearch.addEventListener("input", renderRows);
        refs.filterTier.addEventListener("change", renderRows);
        refs.filterStatus.addEventListener("change", renderRows);
        refs.filterAlliance.addEventListener("change", renderRows);
        refs.copySummary.addEventListener("click", copyDiscordSummary);
        refs.exportCsv.addEventListener("click", exportCsv);
        refs.exportJson.addEventListener("click", exportJson);
        refs.importJson.addEventListener("change", importJson);
        refs.clearBoard.addEventListener("click", clearBoard);
    }

    function syncSetupInputs() {
        refs.boardName.value = state.board.name;
        refs.destinationState.value = state.board.destinationState;
    }

    function submitApplicant(event) {
        event.preventDefault();
        var data = new FormData(refs.form);
        var playerName = cleanText(data.get("playerName"), 80);
        if (!playerName) {
            refs.form.elements.playerName.focus();
            setFormMessage("Player name is required.", true);
            return;
        }
        if (!EDITING_ID && state.applicants.length >= MAX_APPLICANTS) {
            setFormMessage("This board already has the 500-applicant local limit.", true);
            return;
        }
        var applicant = sanitizeApplicant({
            id: EDITING_ID || createId(),
            playerName: playerName,
            currentState: data.get("currentState"),
            tier: data.get("tier"),
            migrationScore: data.get("migrationScore"),
            passesReady: data.get("passesReady") === "on",
            targetAlliance: data.get("targetAlliance"),
            groupName: data.get("groupName"),
            languageTimeZone: data.get("languageTimeZone"),
            coordinator: data.get("coordinator"),
            status: data.get("status"),
            notes: data.get("notes")
        });

        if (EDITING_ID) {
            state.applicants = state.applicants.map(function (existing) {
                return existing.id === EDITING_ID ? applicant : existing;
            });
            track("edit_applicant");
            resetForm();
            setBoardStatus("Applicant updated.");
        } else {
            state.applicants.push(applicant);
            refs.form.reset();
            refs.form.elements.tier.value = "Unknown";
            refs.form.elements.status.value = "New";
            setFormMessage("Applicant added.", false);
            track("add_applicant");
        }
        saveState();
        render();
    }

    function handleRowAction(event) {
        var button = event.target.closest("button[data-row-action]");
        if (!button) {
            return;
        }
        var id = button.getAttribute("data-applicant-id");
        var applicant = state.applicants.find(function (item) {
            return item.id === id;
        });
        if (!applicant) {
            return;
        }
        if (button.getAttribute("data-row-action") === "edit") {
            editApplicant(applicant);
            return;
        }
        if (button.getAttribute("data-row-action") === "delete") {
            if (!window.confirm("Delete " + applicant.playerName + " from this board?")) {
                return;
            }
            state.applicants = state.applicants.filter(function (item) {
                return item.id !== id;
            });
            if (EDITING_ID === id) {
                resetForm();
            }
            saveState();
            render();
            setBoardStatus("Applicant deleted.");
            track("delete_applicant");
        }
    }

    function editApplicant(applicant) {
        EDITING_ID = applicant.id;
        Object.keys(applicant).forEach(function (key) {
            if (!refs.form.elements[key]) {
                return;
            }
            if (key === "passesReady") {
                refs.form.elements[key].checked = applicant[key];
            } else {
                refs.form.elements[key].value = applicant[key];
            }
        });
        refs.formTitle.textContent = "Edit applicant";
        refs.submitCandidate.textContent = "Save applicant";
        refs.cancelEdit.hidden = false;
        setFormMessage("Editing " + applicant.playerName + ".", false);
        refs.form.scrollIntoView({behavior: "smooth", block: "start"});
        refs.form.elements.playerName.focus({preventScroll: true});
    }

    function resetForm() {
        EDITING_ID = null;
        refs.form.reset();
        refs.form.elements.tier.value = "Unknown";
        refs.form.elements.status.value = "New";
        refs.formTitle.textContent = "Add an applicant";
        refs.submitCandidate.textContent = "Add applicant";
        refs.cancelEdit.hidden = true;
        setFormMessage("", false);
    }

    function render() {
        renderSlotSummary();
        renderAllianceFilter();
        renderRows();
    }

    function reservedCounts() {
        var counts = {Regular: 0, Medium: 0, Advanced: 0, Elite: 0};
        state.applicants.forEach(function (applicant) {
            if (TIERS.indexOf(applicant.tier) !== -1 && SLOT_STATUSES.indexOf(applicant.status) !== -1) {
                counts[applicant.tier] += 1;
            }
        });
        return counts;
    }

    function renderSlotSummary() {
        var counts = reservedCounts();
        refs.slotSummary.textContent = "";
        var overages = [];
        TIERS.forEach(function (tier) {
            var used = counts[tier];
            var limit = state.board.quotas[tier];
            var card = document.createElement("article");
            card.className = "migration-slot-card";
            if (used > limit) {
                card.classList.add("is-over");
                overages.push(tier + " is over the current slot limit by " + (used - limit) + ".");
            }
            appendTextElement(card, "span", tier);
            appendTextElement(card, "strong", used + " / " + limit);
            appendTextElement(card, "small", Math.max(0, limit - used) + " remaining");
            refs.slotSummary.appendChild(card);
        });
        refs.boardAlerts.textContent = "";
        refs.boardAlerts.hidden = overages.length === 0;
        if (overages.length) {
            var list = document.createElement("ul");
            overages.forEach(function (warning) {
                appendTextElement(list, "li", warning);
            });
            refs.boardAlerts.appendChild(list);
        }
    }

    function renderAllianceFilter() {
        var selected = refs.filterAlliance.value;
        var alliances = state.applicants.map(function (applicant) {
            return applicant.targetAlliance;
        }).filter(Boolean).filter(function (alliance, index, values) {
            return values.indexOf(alliance) === index;
        }).sort(function (a, b) {
            return a.localeCompare(b);
        });
        refs.filterAlliance.textContent = "";
        var allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "All alliances";
        refs.filterAlliance.appendChild(allOption);
        alliances.forEach(function (alliance) {
            var option = document.createElement("option");
            option.value = alliance;
            option.textContent = alliance;
            refs.filterAlliance.appendChild(option);
        });
        refs.filterAlliance.value = alliances.indexOf(selected) !== -1 ? selected : "";
    }

    function filteredApplicants() {
        var search = refs.filterSearch.value.trim().toLocaleLowerCase();
        var tier = refs.filterTier.value;
        var status = refs.filterStatus.value;
        var alliance = refs.filterAlliance.value;
        return state.applicants.filter(function (applicant) {
            if (tier && applicant.tier !== tier) {
                return false;
            }
            if (status && applicant.status !== status) {
                return false;
            }
            if (alliance && applicant.targetAlliance !== alliance) {
                return false;
            }
            if (!search) {
                return true;
            }
            return [
                applicant.playerName,
                applicant.currentState,
                applicant.targetAlliance,
                applicant.groupName,
                applicant.coordinator,
                applicant.notes
            ].join(" ").toLocaleLowerCase().indexOf(search) !== -1;
        });
    }

    function renderRows() {
        var applicants = filteredApplicants();
        refs.rows.textContent = "";
        refs.applicantCount.textContent = "(" + state.applicants.length + ")";
        refs.emptyState.hidden = applicants.length > 0;
        applicants.forEach(function (applicant) {
            refs.rows.appendChild(createApplicantRow(applicant));
        });
        if (!applicants.length && state.applicants.length) {
            refs.emptyState.querySelector("strong").textContent = "No matching applicants";
            refs.emptyState.querySelector("p").textContent = "Change or clear the current filters.";
        } else if (!state.applicants.length) {
            refs.emptyState.querySelector("strong").textContent = "No applicants yet";
            refs.emptyState.querySelector("p").textContent = "Add the first candidate above, or import an existing JSON board.";
        }
    }

    function createApplicantRow(applicant) {
        var row = document.createElement("tr");

        var playerCell = cell("Player");
        appendTextElement(playerCell, "strong", applicant.playerName, "migration-cell-primary");
        appendTextElement(playerCell, "span", applicant.currentState ? "State " + applicant.currentState : "State not set", "migration-cell-secondary");
        if (applicant.languageTimeZone) {
            appendTextElement(playerCell, "span", applicant.languageTimeZone, "migration-cell-secondary");
        }
        if (applicant.notes) {
            appendTextElement(playerCell, "span", applicant.notes, "migration-cell-note");
        }
        row.appendChild(playerCell);

        var tierCell = cell("Tier / Score");
        appendTextElement(tierCell, "span", applicant.tier, "migration-tier-pill" + (applicant.tier === "Unknown" ? " migration-tier-pill--unknown" : ""));
        appendTextElement(tierCell, "span", applicant.migrationScore ? "Score " + applicant.migrationScore : "No score", "migration-cell-secondary");
        row.appendChild(tierCell);

        var allianceCell = cell("Alliance / Group");
        appendTextElement(allianceCell, "strong", applicant.targetAlliance || "Unassigned", "migration-cell-primary");
        appendTextElement(allianceCell, "span", applicant.groupName || "No move-together group", "migration-cell-secondary");
        row.appendChild(allianceCell);

        var statusCell = cell("Status");
        appendTextElement(statusCell, "span", applicant.status, "migration-status-pill");
        row.appendChild(statusCell);

        var coordinatorCell = cell("Coordinator");
        appendTextElement(coordinatorCell, "span", applicant.coordinator || "Unassigned", "migration-cell-primary");
        row.appendChild(coordinatorCell);

        var readinessCell = cell("Readiness");
        var readiness = document.createElement("div");
        readiness.className = "migration-readiness";
        var warnings = applicantWarnings(applicant);
        if (!warnings.length) {
            appendTextElement(readiness, "span", applicant.passesReady ? "Passes confirmed" : "No active warning", "migration-ready");
        } else {
            warnings.forEach(function (warning) {
                appendTextElement(readiness, "span", warning, "migration-row-warning");
            });
        }
        readinessCell.appendChild(readiness);
        row.appendChild(readinessCell);

        var actionCell = cell("Actions");
        var actions = document.createElement("div");
        actions.className = "migration-row-actions";
        actions.appendChild(rowButton("Edit", "edit", applicant.id));
        actions.appendChild(rowButton("Delete", "delete", applicant.id, true));
        actionCell.appendChild(actions);
        row.appendChild(actionCell);
        return row;
    }

    function applicantWarnings(applicant) {
        var warnings = [];
        if (applicant.tier === "Unknown" && SLOT_STATUSES.indexOf(applicant.status) !== -1) {
            warnings.push("Tier unknown — do not reserve a tier slot yet.");
        }
        if (!applicant.passesReady && PASS_WARNING_STATUSES.indexOf(applicant.status) !== -1) {
            warnings.push("Passes are not confirmed for this applicant.");
        }
        return warnings;
    }

    function cell(label) {
        var element = document.createElement("td");
        element.setAttribute("data-label", label);
        return element;
    }

    function rowButton(text, action, id, danger) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "migration-button" + (danger ? " migration-button--danger" : "");
        button.setAttribute("data-row-action", action);
        button.setAttribute("data-applicant-id", id);
        button.textContent = text;
        return button;
    }

    function appendTextElement(parent, tag, text, className) {
        var element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        element.textContent = text;
        parent.appendChild(element);
        return element;
    }

    function exportJson() {
        downloadFile(fileStem() + ".json", JSON.stringify(state, null, 2), "application/json;charset=utf-8");
        setBoardStatus("JSON board exported.");
        track("export_json");
    }

    function exportCsv() {
        var fields = [
            ["Player name", "playerName"],
            ["Current State", "currentState"],
            ["Identity Tier", "tier"],
            ["Migration Score", "migrationScore"],
            ["Passes ready", "passesReady"],
            ["Target Alliance", "targetAlliance"],
            ["Group / Move Together", "groupName"],
            ["Language / Time Zone", "languageTimeZone"],
            ["Coordinator", "coordinator"],
            ["Status", "status"],
            ["Notes", "notes"]
        ];
        var lines = [fields.map(function (field) { return csvCell(field[0]); }).join(",")];
        state.applicants.forEach(function (applicant) {
            lines.push(fields.map(function (field) {
                var value = field[1] === "passesReady" ? (applicant.passesReady ? "Yes" : "No") : applicant[field[1]];
                return csvCell(value);
            }).join(","));
        });
        downloadFile(fileStem() + ".csv", "\ufeff" + lines.join("\r\n"), "text/csv;charset=utf-8");
        setBoardStatus("CSV exported.");
        track("export_csv");
    }

    function csvCell(value) {
        var text = value === null || value === undefined ? "" : String(value);
        if (/^[=+\-@]/.test(text)) {
            text = "'" + text;
        }
        return '"' + text.replace(/"/g, '""') + '"';
    }

    function downloadFile(filename, content, type) {
        var blob = new Blob([content], {type: type});
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 0);
    }

    function importJson(event) {
        var file = event.target.files && event.target.files[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        if (file.size > MAX_IMPORT_BYTES) {
            setBoardStatus("Import failed: JSON file is larger than 1 MB.", true);
            return;
        }
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var imported = sanitizeState(JSON.parse(String(reader.result || "")));
                if (!window.confirm("Replace this local board with " + imported.applicants.length + " imported applicants?")) {
                    return;
                }
                state = imported;
                resetForm();
                syncSetupInputs();
                saveState("Imported and saved locally");
                render();
                setBoardStatus("JSON board imported.");
                track("import_json");
            } catch (error) {
                setBoardStatus("Import failed: use a Migration Planner JSON export.", true);
            }
        };
        reader.onerror = function () {
            setBoardStatus("Import failed: the file could not be read.", true);
        };
        reader.readAsText(file);
    }

    function copyDiscordSummary() {
        var counts = reservedCounts();
        var title = state.board.name || "State Migration Board";
        var destination = state.board.destinationState ? " → State " + state.board.destinationState : "";
        var lines = ["**" + title + destination + "**", ""];
        TIERS.forEach(function (tier) {
            var limit = state.board.quotas[tier];
            lines.push("• " + tier + ": " + counts[tier] + " / " + limit + " reserved");
        });
        lines.push("", "**Applicants (" + state.applicants.length + ")**");
        if (!state.applicants.length) {
            lines.push("No applicants yet.");
        } else {
            state.applicants.slice(0, 40).forEach(function (applicant) {
                var alliance = applicant.targetAlliance ? " → " + applicant.targetAlliance : "";
                lines.push("• " + applicant.playerName + " | " + applicant.tier + " | " + applicant.status + alliance);
            });
            if (state.applicants.length > 40) {
                lines.push("…and " + (state.applicants.length - 40) + " more in the exported board.");
            }
        }
        copyText(lines.join("\n"), function () {
            setBoardStatus("Discord summary copied.");
            track("copy_discord_summary");
        });
    }

    function copyText(text, onSuccess) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(function () {
                fallbackCopy(text, onSuccess);
            });
            return;
        }
        fallbackCopy(text, onSuccess);
    }

    function fallbackCopy(text, onSuccess) {
        var field = document.createElement("textarea");
        field.value = text;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        try {
            if (document.execCommand("copy")) {
                onSuccess();
            } else {
                setBoardStatus("Copy failed. Export JSON or CSV instead.", true);
            }
        } catch (error) {
            setBoardStatus("Copy failed. Export JSON or CSV instead.", true);
        }
        field.remove();
    }

    function clearBoard() {
        if (!window.confirm("Clear this migration board, including all applicants and board details? Export first if you need a backup.")) {
            return;
        }
        state = defaultState();
        resetForm();
        syncSetupInputs();
        refs.filterSearch.value = "";
        refs.filterTier.value = "";
        refs.filterStatus.value = "";
        refs.filterAlliance.value = "";
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            setSaveState("Local save unavailable", true);
        }
        render();
        setBoardStatus("Board cleared.");
        track("clear_board");
    }

    function fileStem() {
        var base = cleanText(state.board.name, 80) || (state.board.destinationState ? "state-" + state.board.destinationState + "-migration" : "state-migration-board");
        var slug = base.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return (slug || "state-migration-board") + "-" + new Date().toISOString().slice(0, 10);
    }

    function setFormMessage(message, isError) {
        refs.formMessage.textContent = message;
        refs.formMessage.style.color = isError ? "#ffb9b9" : "";
    }

    function setBoardStatus(message, isError) {
        refs.boardStatus.textContent = message;
        refs.boardStatus.style.color = isError ? "#ffb9b9" : "";
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return "applicant-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    }

    function track(action) {
        var params = {
            action: action,
            interaction_source: "migration_planner"
        };
        if (window.analytics && typeof window.analytics.trackEvent === "function") {
            window.analytics.trackEvent("migration_planner_use", params);
            return;
        }
        if (typeof window.gtag === "function") {
            window.gtag("event", "migration_planner_use", params);
        }
    }
}());
