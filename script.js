(function () {
  "use strict";

  // ---------- Configuration ----------

  const config = {
    palette: {
      background: "#121212",
      text: "#ffffff",
      accent1: "#A61A10",
      accent2: "#C43F5A",
      accent3: "#E087B2",
      accent4: "#3967B8",
      accent5: "#13379E",
    },
  };

  // Segment colours used by all wheels
  config.segmentColors = [
    config.palette.accent1,
    config.palette.accent2,
    config.palette.accent3,
    config.palette.accent4,
    config.palette.accent5,
  ];

  // Button configuration
  config.buttons = {
    choice1: [
      { id: "P", label: "P", color: config.palette.accent1 },
      { id: "FS", label: "FS", color: config.palette.accent2 },
    ],
    pSubChoice: [
      { id: "S", label: "S", color: config.palette.accent4 },
      { id: "D", label: "D", color: config.palette.accent5 },
    ],
    tradCL: [
      { id: "CL", label: "CL", color: config.palette.accent3 },
      { id: "NoCL", label: "No CL", color: config.palette.accent4 },
    ],
    restart: {
      id: "restart",
      label: "Restart",
      color: config.palette.accent2,
    },
  };

  // Wheel definitions
  config.wheels = {
    pS: {
      id: "pS",
      title: "P branch – S path wheel",
      segments: [
        { key: "jb", label: "JB", weight: 1 },
        { key: "nhj", label: "NHJ", weight: 1 },
        { key: "tw", label: "TW", weight: 1 },
        { key: "fl", label: "FL", weight: 1 },
      ],
    },
    pD: {
      id: "pD",
      title: "P branch – D path wheel",
      segments: [
        { key: "oil_he", label: "Oil+HE", weight: 40 },
        { key: "no_oil_fp", label: "No oil FP", weight: 60 },
      ],
    },
    fsInitial: {
      id: "fsInitial",
      title: "FS branch – initial wheel",
      segments: [
        { key: "shib", label: "Shib", weight: 10 },
        { key: "outfitDelay", label: "outfit+delay", weight: 10 },
        { key: "oil", label: "Oil", weight: 10 },
        { key: "trad", label: "Trad", weight: 70 },
      ],
    },
    shibStyle: {
      id: "shibStyle",
      title: "Shib sub-wheel",
      segments: [
        { key: "corset", label: "Corset", weight: 1 },
        { key: "restrained", label: "Restrained", weight: 1 },
      ],
    },
    corsetDetail: {
      id: "corsetDetail",
      title: "Corset – Sense-dep / BSC",
      segments: [
        { key: "sense_dep", label: "Sense-dep", weight: 40 },
        { key: "bsc", label: "BSC", weight: 60 },
      ],
    },
    ffBsc: {
      id: "ffBsc",
      title: "F-F / BSC wheel",
      segments: [
        { key: "f_f", label: "F-F", weight: 1 },
        { key: "bsc", label: "BSC", weight: 1 },
      ],
    },
    location: {
      id: "location",
      title: "Location wheel",
      segments: [
        { key: "bedroom", label: "Bedroom", weight: 75 },
        { key: "office", label: "Office", weight: 20 },
        { key: "living_room", label: "Living room", weight: 5 },
      ],
    },
    accessoriesYN: {
      id: "accessoriesYN",
      title: "Accessories wheel",
      segments: [
        { key: "yes", label: "Yes", weight: 1 },
        { key: "no", label: "No", weight: 1 },
      ],
    },
  };

  // FP options and group metadata
  config.fpOptions = [
    { id: "cl_trad", label: "CL:trad", group: "CL", clType: "normal" },
    { id: "cl_96", label: "CL-96", group: "CL", clType: "cl96" },
    { id: "cl_fs", label: "CL:FS", group: "CL", clType: "normal" },
    { id: "jb_side", label: "JB:side", group: "JB" },
    { id: "jb_up", label: "JB:up", group: "JB" },
    { id: "jb_stand", label: "JB:stand", group: "JB" },
    { id: "jb_edge", label: "JB:edge", group: "JB" },
    { id: "jb_on", label: "JB:on", group: "JB" },
    { id: "tw", label: "TW", group: "Other" },
    { id: "nhj", label: "NHJ", group: "Other" },
  ];

  // Accessories candidates
  config.accessoriesOptions = ["9mm", "bb8", "Ag", "clear"];

  // ---------- App state ----------

  let appState;

  function resetAppState() {
    return {
      path: null,
      buttons: [],
      wheels: [],
      fs: {
        tradCLChoice: null,
        fpSelected: [],
        fpRetained: [],
        fpResolved: false,
        ffResolved: false,
        ffBscOutcome: null,
        location: null,
        accessoriesWheel: null,
        accessories: [],
      },
    };
  }

  function setView(contentEl) {
    const root = document.getElementById("app");
    if (!root) return;
    root.innerHTML = "";
    root.appendChild(contentEl);
  }

  function logButton(label, context) {
    if (!appState) return;
    appState.buttons.push({
      label: label,
      context: context || "",
      timestamp: new Date().toISOString(),
    });
  }

  function recordWheel(wheelCfg, selectedSegment, segmentsSnapshot) {
    if (!appState) return;
    appState.wheels.push({
      id: wheelCfg.id,
      title: wheelCfg.title || wheelCfg.id,
      resultLabel: selectedSegment.label,
      resultKey: selectedSegment.key,
      segments: segmentsSnapshot.map(function (seg) {
        return { key: seg.key, label: seg.label, weight: seg.weight };
      }),
    });
  }

  function createButtonFromConfig(btnCfg, context, handler) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = btnCfg.label;
    if (btnCfg.color) {
      btn.style.backgroundColor = btnCfg.color;
    }
    btn.addEventListener("click", function () {
      logButton(btnCfg.label, context);
      handler();
    });
    return btn;
  }

  function createPrimaryButton(label, context, handler, colour) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn primary";
    btn.textContent = label;
    btn.style.backgroundColor = colour || config.palette.accent2;
    btn.addEventListener("click", function () {
      logButton(label, context);
      handler();
    });
    return btn;
  }

  // ---------- Wheel component ----------

  function createWheelComponent(parent, wheelCfg, options) {
    options = options || {};
    const spinLabel = options.spinLabel || "Spin";
    const onResult =
      typeof options.onResult === "function" ? options.onResult : function () {};
    const showEditor = options.showEditor !== false;

    const wrapper = document.createElement("div");
    wrapper.className = "wheel-component";

    const wheelTitle = document.createElement("h3");
    wheelTitle.textContent = wheelCfg.title || "Wheel";

    const wheelWrapper = document.createElement("div");
    wheelWrapper.className = "wheel-wrapper";

    const canvas = document.createElement("canvas");
    canvas.className = "wheel-canvas";
    canvas.width = 320;
    canvas.height = 320;

    const pointer = document.createElement("div");
    pointer.className = "wheel-pointer";

    wheelWrapper.appendChild(canvas);
    wheelWrapper.appendChild(pointer);

    const controls = document.createElement("div");
    controls.className = "wheel-controls";

    const segmentEditor = document.createElement("div");
    segmentEditor.className = "segment-editor";

    let segments = wheelCfg.segments.map(function (seg) {
      return { key: seg.key, label: seg.label, weight: seg.weight };
    });

    const ctx = canvas.getContext("2d");
    let rotation = 0;
    let selectedIndex = null;
    let isSpinning = false;

    function drawWheel() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!segments.length) return;

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) / 2 - 10;
      const anglePerSegment = (Math.PI * 2) / segments.length;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      segments.forEach(function (seg, index) {
        const startAngle = -Math.PI / 2 + index * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        let fill = config.segmentColors[index % config.segmentColors.length];
        if (selectedIndex !== null && index === selectedIndex && !isSpinning) {
          fill = lightenColor(fill, 0.35);
        }

        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = "right";
        ctx.font = "14px system-ui, sans-serif";
        ctx.translate(radius - 12, 0);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(seg.label, 0, 0);
        ctx.restore();
      });

      ctx.restore();
    }

    drawWheel();

    if (showEditor) {
      const editorTitle = document.createElement("h4");
      editorTitle.textContent = "Edit labels and weights";
      segmentEditor.appendChild(editorTitle);

      const grid = document.createElement("div");
      grid.className = "segment-grid";

      segments.forEach(function (seg, index) {
        const row = document.createElement("div");
        row.className = "segment-row";

        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = seg.label;
        labelInput.placeholder = "Label";
        labelInput.className = "segment-label-input";
        labelInput.addEventListener("input", function (e) {
          segments[index].label = e.target.value || "Option " + (index + 1);
          drawWheel();
        });

        const weightInput = document.createElement("input");
        weightInput.type = "number";
        weightInput.min = "0";
        weightInput.step = "1";
        weightInput.value = seg.weight;
        weightInput.title = "Weight";
        weightInput.className = "segment-weight-input";
        weightInput.addEventListener("input", function (e) {
          let val = parseFloat(e.target.value);
          if (isNaN(val) || val < 0) val = 0;
          segments[index].weight = val;
        });

        row.appendChild(labelInput);
        row.appendChild(weightInput);
        grid.appendChild(row);
      });

      segmentEditor.appendChild(grid);
    }

    const spinBtn = document.createElement("button");
    spinBtn.type = "button";
    spinBtn.className = "btn primary wheel-spin-btn";
    spinBtn.textContent = spinLabel;
    spinBtn.style.backgroundColor = config.palette.accent2;

    const resultDiv = document.createElement("div");
    resultDiv.className = "wheel-result";
    resultDiv.textContent = "";

    controls.appendChild(segmentEditor);
    controls.appendChild(spinBtn);
    controls.appendChild(resultDiv);

    wrapper.appendChild(wheelTitle);
    wrapper.appendChild(wheelWrapper);
    wrapper.appendChild(controls);

    parent.appendChild(wrapper);

    spinBtn.addEventListener("click", function () {
      if (isSpinning) return;
      logButton(
        spinLabel + " (" + (wheelCfg.title || wheelCfg.id) + ")",
        "Wheel"
      );
      if (!segments.length) return;

      isSpinning = true;
      spinBtn.disabled = true;
      selectedIndex = null;

      const index = weightedRandomIndex(segments);
      selectedIndex = index;

      const anglePerSegment = (Math.PI * 2) / segments.length;
      const targetAngle = -(index + 0.5) * anglePerSegment;
      const extraRotations = 4 + Math.random() * 2;
      const finalRotation = extraRotations * Math.PI * 2 + targetAngle;

      const startRotation = rotation;
      const duration = 4000;
      const startTime = performance.now();

      function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(t);
        rotation = startRotation + (finalRotation - startRotation) * eased;
        drawWheel();
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          isSpinning = false;
          selectedIndex = index;
          drawWheel();
          const winningSegment = segments[index];
          resultDiv.textContent = "Result: " + winningSegment.label;
          const snapshot = segments.map(function (seg) {
            return { key: seg.key, label: seg.label, weight: seg.weight };
          });
          onResult(winningSegment, snapshot);
        }
      }

      requestAnimationFrame(animate);
    });
  }

  // ---------- Utility helpers ----------

  function weightedRandomIndex(segments) {
    const total = segments.reduce(function (sum, seg) {
      let w = parseFloat(seg.weight);
      if (isNaN(w) || w < 0) w = 0;
      return sum + w;
    }, 0);

    if (total <= 0) {
      return Math.floor(Math.random() * segments.length);
    }

    const r = Math.random() * total;
    let acc = 0;
    for (let i = 0; i < segments.length; i++) {
      let w = parseFloat(segments[i].weight);
      if (isNaN(w) || w < 0) w = 0;
      acc += w;
      if (r <= acc) return i;
    }
    return segments.length - 1;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function lightenColor(hex, amount) {
    if (!hex || hex[0] !== "#" || (hex.length !== 7 && hex.length !== 4)) {
      return hex;
    }
    let r, g, b;
    if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    } else {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    }
    r = Math.min(255, Math.round(r + (255 - r) * amount));
    g = Math.min(255, Math.round(g + (255 - g) * amount));
    b = Math.min(255, Math.round(b + (255 - b) * amount));
    const toHex = function (v) {
      const s = v.toString(16);
      return s.length === 1 ? "0" + s : s;
    };
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  function animateKeepDiscardSlot(windowEl, finalState) {
    const items = windowEl.querySelectorAll(".slot-item");
    if (!items.length) return;
    const itemHeight = items[0].offsetHeight || 28;
    let index = 0;
    let cycles = 0;
    const maxCycles = 10 + Math.floor(Math.random() * 6);

    function tick() {
      cycles += 1;
      index = index === 0 ? 1 : 0;
      const offset = -index * itemHeight;
      windowEl.style.transform = "translateY(" + offset + "px)";
      if (cycles < maxCycles) {
        setTimeout(tick, 90);
      } else {
        const finalIndex = finalState === "kept" ? 0 : 1;
        const finalOffset = -finalIndex * itemHeight;
        setTimeout(function () {
          windowEl.style.transform = "translateY(" + finalOffset + "px)";
          if (windowEl.parentElement) {
            windowEl.parentElement.classList.add(
              finalState === "kept" ? "slot-kept" : "slot-discarded"
            );
          }
        }, 90);
      }
    }

    tick();
  }

  function animateAccessoriesSlot(windowEl, items, targetLabel) {
    const children = windowEl.querySelectorAll(".slot-item");
    if (!children.length) return;
    const itemHeight = children[0].offsetHeight || 32;
    let index = 0;
    let steps = 0;
    const maxSteps = 18 + Math.floor(Math.random() * 10);
    let targetIndex = items.indexOf(targetLabel);
    if (targetIndex === -1) targetIndex = 0;

    function tick() {
      steps += 1;
      if (steps < maxSteps) {
        index = (index + 1) % items.length;
      } else {
        index = targetIndex;
      }
      const offset = -index * itemHeight;
      windowEl.style.transform = "translateY(" + offset + "px)";
      if (steps < maxSteps + 4) {
        setTimeout(tick, 90);
      }
    }

    tick();
  }

  function pickRandomSubset(array, count) {
    const copy = array.slice();
    const result = [];
    for (let i = 0; i < count && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return result;
  }

  // ---------- FP multi-picker ----------

  function renderFPMultiPicker(parent, onResolved) {
    const container = document.createElement("div");
    container.className = "fp-card";

    const title = document.createElement("h3");
    title.textContent = "FP picker";

    const helper = document.createElement("p");
    helper.className = "helper-text";
    if (appState.fs.tradCLChoice === "No CL") {
      helper.textContent =
        "CL was set to No CL, so CL options are hidden. Tap to select from the remaining FP options.";
    } else {
      helper.textContent =
        "Tap to select FP options. At most one CL and one JB can be active, and CL-96 excludes JB.";
    }

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "fp-options";

    const resultsArea = document.createElement("div");
    resultsArea.className = "fp-results slot-area";

    const noCL = appState.fs.tradCLChoice === "No CL";
    const availableOptions = config.fpOptions.filter(function (opt) {
      return !(noCL && opt.group === "CL");
    });

    const selectedIds = new Set();
    const optionButtons = {};
    let resolveBtn;

    function setHelper(text) {
      helper.textContent = text;
    }

    availableOptions.forEach(function (opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fp-option";
      if (opt.group === "CL") {
        btn.classList.add("fp-cl");
      } else if (opt.group === "JB") {
        btn.classList.add("fp-jb");
      } else {
        btn.classList.add("fp-other");
      }
      btn.textContent = opt.label;

      btn.addEventListener("click", function () {
        toggleSelection(opt, btn);
      });

      optionButtons[opt.id] = btn;
      optionsContainer.appendChild(btn);
    });

    function toggleSelection(opt, element) {
      if (selectedIds.has(opt.id)) {
        selectedIds.delete(opt.id);
        element.classList.remove("selected");
        return;
      }

      if (opt.group === "JB") {
        const cl96 = availableOptions.find(function (o) {
          return o.clType === "cl96";
        });
        if (cl96 && selectedIds.has(cl96.id)) {
          setHelper(
            "CL-96 cannot be combined with JB. Deselect CL-96 first if you want JB."
          );
          return;
        }
        // at most one JB
        availableOptions.forEach(function (o) {
          if (o.group === "JB" && selectedIds.has(o.id)) {
            selectedIds.delete(o.id);
            if (optionButtons[o.id]) {
              optionButtons[o.id].classList.remove("selected");
            }
          }
        });
      }

      if (opt.group === "CL") {
        // at most one CL
        availableOptions.forEach(function (o) {
          if (o.group === "CL" && selectedIds.has(o.id)) {
            selectedIds.delete(o.id);
            if (optionButtons[o.id]) {
              optionButtons[o.id].classList.remove("selected");
            }
          }
        });

        if (opt.clType === "cl96") {
          // CL-96 clears JB selections
          availableOptions.forEach(function (o) {
            if (o.group === "JB" && selectedIds.has(o.id)) {
              selectedIds.delete(o.id);
              if (optionButtons[o.id]) {
                optionButtons[o.id].classList.remove("selected");
              }
            }
          });
          setHelper("CL-96 selected. JB options are blocked while CL-96 is active.");
        } else {
          // non-CL-96 CL clears CL-96 if present
          const cl96Opt = availableOptions.find(function (o) {
            return o.clType === "cl96";
          });
          if (cl96Opt && selectedIds.has(cl96Opt.id)) {
            selectedIds.delete(cl96Opt.id);
            if (optionButtons[cl96Opt.id]) {
              optionButtons[cl96Opt.id].classList.remove("selected");
            }
          }
        }
      }

      selectedIds.add(opt.id);
      element.classList.add("selected");
    }

    function handleResolveClick() {
      if (resolveBtn.disabled) return;

      const selectedOptions = availableOptions.filter(function (opt) {
        return selectedIds.has(opt.id);
      });

      appState.fs.fpSelected = selectedOptions.map(function (opt) {
        return { id: opt.id, label: opt.label, group: opt.group };
      });

      resultsArea.innerHTML = "";

      if (!selectedOptions.length) {
        const none = document.createElement("p");
        none.textContent =
          "No FP options selected; there is nothing to resolve.";
        resultsArea.appendChild(none);

        appState.fs.fpRetained = [];
        appState.fs.fpResolved = true;
        resolveBtn.disabled = true;
        if (typeof onResolved === "function") onResolved();
        return;
      }

      const retained = [];

      selectedOptions.forEach(function (opt) {
        if (opt.group === "CL" || opt.group === "JB") {
          const keep = Math.random() < 0.5;
          if (keep) retained.push(opt);

          const row = document.createElement("div");
          row.className = "fp-slot-row";

          const labelSpan = document.createElement("span");
          labelSpan.className = "fp-slot-label";
          labelSpan.textContent = opt.label;

          const slot = document.createElement("div");
          slot.className = "slot-reel small";

          const windowEl = document.createElement("div");
          windowEl.className = "slot-window";

          const itemKeep = document.createElement("div");
          itemKeep.className = "slot-item";
          itemKeep.textContent = "kept";

          const itemDrop = document.createElement("div");
          itemDrop.className = "slot-item";
          itemDrop.textContent = "not at all";

          windowEl.appendChild(itemKeep);
          windowEl.appendChild(itemDrop);
          slot.appendChild(windowEl);

          row.appendChild(labelSpan);
          row.appendChild(slot);
          resultsArea.appendChild(row);

          animateKeepDiscardSlot(windowEl, keep ? "kept" : "not at all");
        } else {
          // TW or NHJ – always retained
          retained.push(opt);
          const rowFixed = document.createElement("div");
          rowFixed.className = "fp-fixed-row";
          rowFixed.textContent = opt.label + " is kept.";
          resultsArea.appendChild(rowFixed);
        }
      });

      appState.fs.fpRetained = retained.map(function (opt) {
        return { id: opt.id, label: opt.label, group: opt.group };
      });

      const summary = document.createElement("p");
      summary.className = "fp-summary-line";
      if (retained.length > 0) {
        summary.textContent =
          "Retained: " +
          retained
            .map(function (o) {
              return o.label;
            })
            .join(", ");
      } else {
        summary.textContent = "No FP options were retained.";
      }
      resultsArea.appendChild(summary);

      appState.fs.fpResolved = true;
      resolveBtn.disabled = true;
      if (typeof onResolved === "function") onResolved();
    }

    resolveBtn = createPrimaryButton(
      "Resolve FP",
      "FP resolve",
      handleResolveClick,
      config.palette.accent3
    );

    container.appendChild(title);
    container.appendChild(helper);
    container.appendChild(optionsContainer);
    container.appendChild(resolveBtn);
    container.appendChild(resultsArea);

    parent.appendChild(container);
  }

  // ---------- Flow: initial choice ----------

  function showChoice1() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "Step 1: Choose path";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Select P or FS to start. The rest of the flow adapts to your choice.";

    const buttonsRow = document.createElement("div");
    buttonsRow.className = "button-row";

    config.buttons.choice1.forEach(function (btnCfg) {
      const btn = createButtonFromConfig(btnCfg, "Initial choice", function () {
        appState.path = btnCfg.id;
        if (btnCfg.id === "P") {
          showPSubChoice();
        } else {
          showFSInitialWheel();
        }
      });
      buttonsRow.appendChild(btn);
    });

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(buttonsRow);

    setView(card);
  }

  // ---------- P branch ----------

  function showPSubChoice() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "P branch – choose S or D";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Select S or D to move to the corresponding P wheel.";

    const buttonsRow = document.createElement("div");
    buttonsRow.className = "button-row";

    config.buttons.pSubChoice.forEach(function (btnCfg) {
      const btn = createButtonFromConfig(
        btnCfg,
        "P branch choice",
        function () {
          if (btnCfg.id === "S") {
            showPSWheel();
          } else {
            showPDWheel();
          }
        }
      );
      buttonsRow.appendChild(btn);
    });

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(buttonsRow);

    setView(card);
  }

  function showPSWheel() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "P branch – S path";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Spin to choose between JB, NHJ, TW and FL. You can adjust labels and weights first.";

    card.appendChild(title);
    card.appendChild(subtitle);

    createWheelComponent(card, config.wheels.pS, {
      spinLabel: "Spin S wheel",
      onResult: function (segment, snapshot) {
        recordWheel(config.wheels.pS, segment, snapshot);
        showFinalSummary();
      },
    });

    setView(card);
  }

  function showPDWheel() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "P branch – D path";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Spin to choose between Oil+HE and No oil FP. Labels and weights are editable.";

    card.appendChild(title);
    card.appendChild(subtitle);

    createWheelComponent(card, config.wheels.pD, {
      spinLabel: "Spin D wheel",
      onResult: function (segment, snapshot) {
        recordWheel(config.wheels.pD, segment, snapshot);
        showFinalSummary();
      },
    });

    setView(card);
  }

  // ---------- FS branch ----------

  function showFSInitialWheel() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS branch – initial wheel";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "This wheel sends you to Shib, outfit+delay, Oil or Trad. Edit labels and weights if you wish, then spin.";

    card.appendChild(title);
    card.appendChild(subtitle);

    createWheelComponent(card, config.wheels.fsInitial, {
      spinLabel: "Spin FS wheel",
      onResult: function (segment, snapshot) {
        recordWheel(config.wheels.fsInitial, segment, snapshot);
        if (segment.key === "shib") {
          showShibSubWheel();
        } else if (segment.key === "trad") {
          showTradCLChoice();
        } else {
          // outfit+delay or Oil – go straight to FS terminus
          enterFSTerminus();
        }
      },
    });

    setView(card);
  }

  function showShibSubWheel() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS branch – Shib sub-wheel";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent = "Spin to choose between Corset and Restrained.";

    card.appendChild(title);
    card.appendChild(subtitle);

    createWheelComponent(card, config.wheels.shibStyle, {
      spinLabel: "Spin Shib wheel",
      onResult: function (segment, snapshot) {
        recordWheel(config.wheels.shibStyle, segment, snapshot);
        if (segment.key === "corset") {
          showCorsetDetailWheel();
        } else {
          enterFSTerminus();
        }
      },
    });

    setView(card);
  }

  function showCorsetDetailWheel() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS branch – Corset detail";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Spin to decide between Sense-dep and BSC. The result is recorded then you move to FS terminus.";

    card.appendChild(title);
    card.appendChild(subtitle);

    createWheelComponent(card, config.wheels.corsetDetail, {
      spinLabel: "Spin Sense-dep / BSC",
      onResult: function (segment, snapshot) {
        recordWheel(config.wheels.corsetDetail, segment, snapshot);
        enterFSTerminus();
      },
    });

    setView(card);
  }

  function showTradCLChoice() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS branch – Trad: CL or No CL";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Choose whether CL options are allowed in the FP picker.";

    const buttonsRow = document.createElement("div");
    buttonsRow.className = "button-row";

    config.buttons.tradCL.forEach(function (btnCfg) {
      const btn = createButtonFromConfig(
        btnCfg,
        "Trad CL / No CL",
        function () {
          appState.fs.tradCLChoice = btnCfg.id === "NoCL" ? "No CL" : "CL";
          showFPAndFFBSC();
        }
      );
      buttonsRow.appendChild(btn);
    });

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(buttonsRow);

    setView(card);
  }

  function showFPAndFFBSC() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS branch – FP and F-F / BSC";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Select FP options and resolve the 50/50 checks, then spin the F-F / BSC wheel. Both complete before moving to FS terminus.";

    card.appendChild(title);
    card.appendChild(subtitle);

    appState.fs.fpResolved = false;
    appState.fs.ffResolved = false;

    const layout = document.createElement("div");
    layout.className = "dual-layout";

    const fpPanel = document.createElement("div");
    fpPanel.className = "panel fp-panel";

    const wheelPanel = document.createElement("div");
    wheelPanel.className = "panel wheel-panel";

    layout.appendChild(fpPanel);
    layout.appendChild(wheelPanel);
    card.appendChild(layout);

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const continueBtn = createPrimaryButton(
      "Continue to FS terminus",
      "FP / F-F continue",
      function () {
        enterFSTerminus();
      },
      config.palette.accent1
    );
    continueBtn.disabled = true;

    footer.appendChild(continueBtn);
    card.appendChild(footer);

    function updateContinueState() {
      continueBtn.disabled = !(appState.fs.fpResolved && appState.fs.ffResolved);
    }

    renderFPMultiPicker(fpPanel, function () {
      appState.fs.fpResolved = true;
      updateContinueState();
    });

    createWheelComponent(wheelPanel, config.wheels.ffBsc, {
      spinLabel: "Spin F-F / BSC",
      onResult: function (segment, snapshot) {
        recordWheel(config.wheels.ffBsc, segment, snapshot);
        appState.fs.ffBscOutcome = segment.label;
        appState.fs.ffResolved = true;
        updateContinueState();
      },
    });

    setView(card);
  }

  // ---------- FS terminus ----------

  function enterFSTerminus() {
    showLocationWheel();
  }

  function showLocationWheel() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS terminus – location";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent = "Spin to decide the location.";

    card.appendChild(title);
    card.appendChild(subtitle);

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const continueBtn = createPrimaryButton(
      "Continue to accessories",
      "FS location continue",
      function () {
        showAccessoriesWheel();
      },
      config.palette.accent1
    );
    continueBtn.disabled = true;

    createWheelComponent(card, config.wheels.location, {
      spinLabel: "Spin location",
      onResult: function (segment, snapshot) {
        recordWheel(config.wheels.location, segment, snapshot);
        appState.fs.location = segment.label;
        continueBtn.disabled = false;
      },
    });

    footer.appendChild(continueBtn);
    card.appendChild(footer);

    setView(card);
  }

  function showAccessoriesWheel() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS terminus – accessories wheel";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Spin to see whether accessories are involved, then either pick accessories or go straight to the summary.";

    card.appendChild(title);
    card.appendChild(subtitle);

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const continueBtn = createPrimaryButton(
      "Continue",
      "Accessories wheel continue",
      function () {
        if (continueBtn.dataset.next === "accessories") {
          showAccessoriesPicker();
        } else {
          showFinalSummary();
        }
      },
      config.palette.accent1
    );
    continueBtn.disabled = true;
    continueBtn.dataset.next = "summary";

    createWheelComponent(card, config.wheels.accessoriesYN, {
      spinLabel: "Spin accessories",
      onResult: function (segment, snapshot) {
        recordWheel(config.wheels.accessoriesYN, segment, snapshot);
        appState.fs.accessoriesWheel = segment.label;
        if (segment.key === "yes") {
          continueBtn.textContent = "Pick accessories";
          continueBtn.dataset.next = "accessories";
        } else {
          continueBtn.textContent = "Go to summary";
          continueBtn.dataset.next = "summary";
        }
        continueBtn.disabled = false;
      },
    });

    footer.appendChild(continueBtn);
    card.appendChild(footer);

    setView(card);
  }

  function showAccessoriesPicker() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS terminus – accessories picker";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Click the button to let the reels pick either one or two accessories at random.";

    const list = document.createElement("div");
    list.className = "accessory-list";

    config.accessoriesOptions.forEach(function (name) {
      const item = document.createElement("div");
      item.className = "accessory-chip";
      item.textContent = name;
      list.appendChild(item);
    });

    const slotsArea = document.createElement("div");
    slotsArea.className = "slot-area accessory-slots";

    const buttonsRow = document.createElement("div");
    buttonsRow.className = "button-row";

    const continueBtn = createPrimaryButton(
      "Go to summary",
      "Accessories picker continue",
      function () {
        showFinalSummary();
      },
      config.palette.accent1
    );
    continueBtn.disabled = true;

    const pickBtn = createPrimaryButton(
      "Pick accessories",
      "Pick accessories",
      function () {
        if (pickBtn.disabled) return;
        pickBtn.disabled = true;

        const count = Math.random() < 0.5 ? 1 : 2;
        const chosen = pickRandomSubset(config.accessoriesOptions, count);
        appState.fs.accessories = chosen.slice();

        slotsArea.innerHTML = "";

        const reelRow = document.createElement("div");
        reelRow.className = "accessory-reels";

        chosen.forEach(function (name) {
          const slot = document.createElement("div");
          slot.className = "slot-reel";

          const windowEl = document.createElement("div");
          windowEl.className = "slot-window";

          config.accessoriesOptions.forEach(function (optName) {
            const item = document.createElement("div");
            item.className = "slot-item";
            item.textContent = optName;
            windowEl.appendChild(item);
          });

          slot.appendChild(windowEl);
          reelRow.appendChild(slot);

          animateAccessoriesSlot(
            windowEl,
            config.accessoriesOptions,
            name
          );
        });

        slotsArea.appendChild(reelRow);

        const summary = document.createElement("p");
        summary.className = "fp-summary-line";
        summary.textContent =
          "Selected accessories: " + chosen.join(", ");
        slotsArea.appendChild(summary);

        continueBtn.disabled = false;
      },
      config.palette.accent2
    );

    buttonsRow.appendChild(pickBtn);
    buttonsRow.appendChild(continueBtn);

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(list);
    card.appendChild(slotsArea);
    card.appendChild(buttonsRow);

    setView(card);
  }

  // ---------- Final summary ----------

  function showFinalSummary() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "Summary";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "This overview shows the path taken, all wheel results and the detailed FS outcomes where relevant.";

    card.appendChild(title);
    card.appendChild(subtitle);

    // Path
    const pathSection = document.createElement("section");
    pathSection.className = "summary-section";

    const pathHeading = document.createElement("h3");
    pathHeading.textContent = "Path";
    pathSection.appendChild(pathHeading);

    const pathRow = document.createElement("div");
    pathRow.className = "summary-row";

    const pathLabel = document.createElement("span");
    pathLabel.className = "summary-label";
    pathLabel.textContent = "Branch";

    const pathValue = document.createElement("span");
    pathValue.className = "summary-value";
    pathValue.textContent = appState.path || "Not set";

    pathRow.appendChild(pathLabel);
    pathRow.appendChild(pathValue);
    pathSection.appendChild(pathRow);
    card.appendChild(pathSection);

    // Buttons
    const btnSection = document.createElement("section");
    btnSection.className = "summary-section";

    const btnHeading = document.createElement("h3");
    btnHeading.textContent = "Buttons clicked";
    btnSection.appendChild(btnHeading);

    if (!appState.buttons.length) {
      const none = document.createElement("p");
      none.textContent = "No buttons were recorded.";
      btnSection.appendChild(none);
    } else {
      const list = document.createElement("ul");
      list.className = "summary-list";
      appState.buttons.forEach(function (entry, index) {
        const li = document.createElement("li");
        const context = entry.context ? entry.context + " – " : "";
        li.textContent = index + 1 + ". " + context + entry.label;
        list.appendChild(li);
      });
      btnSection.appendChild(list);
    }

    card.appendChild(btnSection);

    // Wheels
    const wheelsSection = document.createElement("section");
    wheelsSection.className = "summary-section";

    const wheelsHeading = document.createElement("h3");
    wheelsHeading.textContent = "Wheel outcomes";
    wheelsSection.appendChild(wheelsHeading);

    if (!appState.wheels.length) {
      const noWheels = document.createElement("p");
      noWheels.textContent = "No wheels were spun.";
      wheelsSection.appendChild(noWheels);
    } else {
      appState.wheels.forEach(function (w) {
        const row = document.createElement("div");
        row.className = "summary-row";

        const label = document.createElement("span");
        label.className = "summary-label";
        label.textContent = w.title;

        const value = document.createElement("span");
        value.className = "summary-value";
        value.textContent = w.resultLabel;

        row.appendChild(label);
        row.appendChild(value);
        wheelsSection.appendChild(row);
      });
    }

    card.appendChild(wheelsSection);

    // FS-only detail
    if (appState.path === "FS") {
      const fsSection = document.createElement("section");
      fsSection.className = "summary-section";

      const fsHeading = document.createElement("h3");
      fsHeading.textContent = "FS branch details";
      fsSection.appendChild(fsHeading);

      // Trad CL / No CL
      const tradRow = document.createElement("div");
      tradRow.className = "summary-row";

      const tradLabel = document.createElement("span");
      tradLabel.className = "summary-label";
      tradLabel.textContent = "Trad CL / No CL";

      const tradValue = document.createElement("span");
      tradValue.className = "summary-value";
      tradValue.textContent = appState.fs.tradCLChoice || "N/A";

      tradRow.appendChild(tradLabel);
      tradRow.appendChild(tradValue);
      fsSection.appendChild(tradRow);

      // FP selected
      const fpSelectedRow = document.createElement("div");
      fpSelectedRow.className = "summary-row";

      const fpSelectedLabel = document.createElement("span");
      fpSelectedLabel.className = "summary-label";
      fpSelectedLabel.textContent = "FP – selected";

      const fpSelectedValue = document.createElement("span");
      fpSelectedValue.className = "summary-value";
      if (!appState.fs.fpSelected.length) {
        fpSelectedValue.textContent = "None";
      } else {
        fpSelectedValue.textContent = appState.fs.fpSelected
          .map(function (o) {
            return o.label;
          })
          .join(", ");
      }

      fpSelectedRow.appendChild(fpSelectedLabel);
      fpSelectedRow.appendChild(fpSelectedValue);
      fsSection.appendChild(fpSelectedRow);

      // FP retained
      const fpRetainedRow = document.createElement("div");
      fpRetainedRow.className = "summary-row";

      const fpRetainedLabel = document.createElement("span");
      fpRetainedLabel.className = "summary-label";
      fpRetainedLabel.textContent = "FP – retained after 50/50";

      const fpRetainedValue = document.createElement("span");
      fpRetainedValue.className = "summary-value";
      if (!appState.fs.fpRetained.length) {
        fpRetainedValue.textContent = "None";
      } else {
        fpRetainedValue.textContent = appState.fs.fpRetained
          .map(function (o) {
            return o.label;
          })
          .join(", ");
      }

      fpRetainedRow.appendChild(fpRetainedLabel);
      fpRetainedRow.appendChild(fpRetainedValue);
      fsSection.appendChild(fpRetainedRow);

      // F-F / BSC outcome
      const ffRow = document.createElement("div");
      ffRow.className = "summary-row";

      const ffLabel = document.createElement("span");
      ffLabel.className = "summary-label";
      ffLabel.textContent = "F-F / BSC";

      const ffValue = document.createElement("span");
      ffValue.className = "summary-value";
      ffValue.textContent = appState.fs.ffBscOutcome || "N/A";

      ffRow.appendChild(ffLabel);
      ffRow.appendChild(ffValue);
      fsSection.appendChild(ffRow);

      // Location
      const locRow = document.createElement("div");
      locRow.className = "summary-row";

      const locLabel = document.createElement("span");
      locLabel.className = "summary-label";
      locLabel.textContent = "Location";

      const locValue = document.createElement("span");
      locValue.className = "summary-value";
      locValue.textContent = appState.fs.location || "N/A";

      locRow.appendChild(locLabel);
      locRow.appendChild(locValue);
      fsSection.appendChild(locRow);

      // Accessories yes/no
      const accWheelRow = document.createElement("div");
      accWheelRow.className = "summary-row";

      const accWheelLabel = document.createElement("span");
      accWheelLabel.className = "summary-label";
      accWheelLabel.textContent = "Accessories wheel";

      const accWheelValue = document.createElement("span");
      accWheelValue.className = "summary-value";
      accWheelValue.textContent = appState.fs.accessoriesWheel || "N/A";

      accWheelRow.appendChild(accWheelLabel);
      accWheelRow.appendChild(accWheelValue);
      fsSection.appendChild(accWheelRow);

      // Accessories chosen
      const accRow = document.createElement("div");
      accRow.className = "summary-row";

      const accLabel = document.createElement("span");
      accLabel.className = "summary-label";
      accLabel.textContent = "Accessories chosen";

      const accValue = document.createElement("span");
      accValue.className = "summary-value";
      if (!appState.fs.accessories || !appState.fs.accessories.length) {
        accValue.textContent = "None";
      } else {
        accValue.textContent = appState.fs.accessories.join(", ");
      }

      accRow.appendChild(accLabel);
      accRow.appendChild(accValue);
      fsSection.appendChild(accRow);

      card.appendChild(fsSection);
    }

    // Restart
    const footer = document.createElement("div");
    footer.className = "card-footer";

    const restartBtn = createButtonFromConfig(
      config.buttons.restart,
      "Restart",
      function () {
        appState = resetAppState();
        showChoice1();
      }
    );

    footer.appendChild(restartBtn);
    card.appendChild(footer);

    setView(card);
  }

  // ---------- Init ----------

  function init() {
    appState = resetAppState();
    showChoice1();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

