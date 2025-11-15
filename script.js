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

  // Wheel definitions (weights now all single digits)
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
        { key: "oil_he", label: "Oil+HE", weight: 4 },
        { key: "no_oil_fp", label: "No oil FP", weight: 6 },
      ],
    },
    fsInitial: {
      id: "fsInitial",
      title: "FS branch – initial wheel",
      segments: [
        { key: "shib", label: "Shib", weight: 1 },
        { key: "outfitDelay", label: "outfit+delay", weight: 1 },
        { key: "oil", label: "Oil", weight: 1 },
        { key: "trad", label: "Trad", weight: 7 },
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
      title: "Sense-dep / BSC wheel",
      segments: [
        { key: "sense_dep", label: "Sense-dep", weight: 4 },
        { key: "bsc", label: "BSC", weight: 6 },
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
        { key: "bedroom", label: "Bedroom", weight: 8 },
        { key: "office", label: "Office", weight: 2 },
        { key: "living_room", label: "Living room", weight: 1 },
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

  // FP options and grouping
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
    { id: "x", label: "X", group: "Other" },
  ];

  config.accessoriesOptions = ["9mm", "bb8", "Ag", "clear"];

  // ---------- State ----------

  let appState;

  function resetAppState() {
    return {
      path: null,
      p: {
        subChoice: null,
        wheelResult: null, // S or D wheel
      },
      fs: {
        fsInitialOutcome: null,
        fsInitialKey: null,

        shibStyle: null,
        corsetDetail: null,

        tradCLChoice: null,

        fpFinal: { cl: null, jb: null, other: null },
        ffOutcome: null,

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

  // ---------- Overlay helper ----------

  function showResultOverlay(text, callback) {
    const overlay = document.createElement("div");
    overlay.className = "result-overlay";

    const box = document.createElement("div");
    box.className = "result-box";
    box.textContent = text;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    setTimeout(function () {
      overlay.classList.add("fade-out");
      setTimeout(function () {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (typeof callback === "function") {
          callback();
        }
      }, 260);
    }, 2000);
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

  function computeSegmentGeometry(segments) {
    const fullCircle = Math.PI * 2;
    const totalWeight = segments.reduce(function (sum, seg) {
      let w = parseFloat(seg.weight);
      if (isNaN(w) || w < 0) w = 0;
      return sum + w;
    }, 0);

    const geom = [];
    let currentAngle = -Math.PI / 2; // start at top

    if (segments.length === 0) return geom;

    if (totalWeight <= 0) {
      const anglePer = fullCircle / segments.length;
      segments.forEach(function () {
        const start = currentAngle;
        const end = start + anglePer;
        const mid = (start + end) / 2;
        geom.push({ startAngle: start, endAngle: end, midAngle: mid });
        currentAngle = end;
      });
    } else {
      segments.forEach(function (seg) {
        let w = parseFloat(seg.weight);
        if (isNaN(w) || w < 0) w = 0;
        const angle = fullCircle * (w / totalWeight);
        const start = currentAngle;
        const end = start + angle;
        const mid = start + angle / 2;
        geom.push({ startAngle: start, endAngle: end, midAngle: mid });
        currentAngle = end;
      });
    }
    return geom;
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

  // Slot animation: fixed item height, optional callback when finished
  function animateAccessoriesSlot(windowEl, items, targetLabel, done) {
    const children = windowEl.querySelectorAll(".slot-item");
    if (!children.length) return;
    const itemHeight = 32; // match CSS
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
      } else if (typeof done === "function") {
        done();
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

  // ---------- UI helpers ----------

  function createButtonFromConfig(btnCfg, handler) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = btnCfg.label;
    if (btnCfg.color) {
      btn.style.backgroundColor = btnCfg.color;
    }
    btn.addEventListener("click", handler);
    return btn;
  }

  function createPrimaryButton(label, handler, colour) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn primary";
    btn.textContent = label;
    btn.style.backgroundColor = colour || config.palette.accent2;
    btn.addEventListener("click", handler);
    return btn;
  }

  function createBackButton(onBack) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-back";
    btn.textContent = "Back";
    btn.addEventListener("click", onBack);
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

    // Pointer removed visually to avoid any mismatch confusion
    // const pointer = document.createElement("div");
    // pointer.className = "wheel-pointer";

    wheelWrapper.appendChild(canvas);
    // wheelWrapper.appendChild(pointer);

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
      const geom = computeSegmentGeometry(segments);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      geom.forEach(function (g, index) {
        const seg = segments[index];

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, g.startAngle, g.endAngle);
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
        ctx.rotate(g.midAngle);
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
          drawWheel();
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
    resultDiv.textContent = ""; // no immediate result text visible

    controls.appendChild(segmentEditor);
    controls.appendChild(spinBtn);
    controls.appendChild(resultDiv);

    wrapper.appendChild(wheelTitle);
    wrapper.appendChild(wheelWrapper);
    wrapper.appendChild(controls);

    parent.appendChild(wrapper);

    spinBtn.addEventListener("click", function () {
      if (isSpinning) return;
      if (!segments.length) return;

      isSpinning = true;
      spinBtn.disabled = true;
      selectedIndex = null;
      rotation = 0;

      const index = weightedRandomIndex(segments);
      selectedIndex = index;

      const geom = computeSegmentGeometry(segments);
      const midAngle =
        geom[index] && typeof geom[index].midAngle === "number"
          ? geom[index].midAngle
          : -Math.PI / 2;
      const extraRotations = 4 + Math.random() * 2;
      const targetAngleBase = -Math.PI / 2 - midAngle;
      const finalRotation = extraRotations * Math.PI * 2 + targetAngleBase;

      const startRotation = 0;
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
          const snapshot = segments.map(function (seg) {
            return { key: seg.key, label: seg.label, weight: seg.weight };
          });
          onResult(winningSegment, snapshot);
          spinBtn.disabled = false;
        }
      }

      requestAnimationFrame(animate);
    });
  }

  // ---------- FP random picker (slot-style, with CL/JB/Other slots) ----------

  function renderFPRandomPicker(parent, onResolved) {
    const container = document.createElement("div");
    container.className = "fp-card";

    const title = document.createElement("h3");
    title.textContent = "FP picker";

    const helper = document.createElement("p");
    helper.className = "helper-text";

    const usingCL = appState.fs.tradCLChoice === "CL";
    if (!usingCL) {
      helper.textContent =
        "CL is set to No CL, so only JB and Other FP options (including X) are used. JB is always guaranteed.";
    } else {
      helper.textContent =
        "CL is enabled: you will always get a CL result, and a JB result unless CL-96 appears (which blocks JB).";
    }

    const optionsStatic = document.createElement("div");
    optionsStatic.className = "fp-options-static";

    const noCL = appState.fs.tradCLChoice === "No CL";
    const eligibleOptions = config.fpOptions.filter(function (opt) {
      return !(noCL && opt.group === "CL");
    });

    eligibleOptions.forEach(function (opt) {
      const chip = document.createElement("span");
      chip.className = "fp-chip";
      chip.textContent = opt.label;
      optionsStatic.appendChild(chip);
    });

    const slotArea = document.createElement("div");
    slotArea.className = "slot-area";

    let animating = false;

    function randomFromArray(arr) {
      if (!arr.length) return null;
      const idx = Math.floor(Math.random() * arr.length);
      return arr[idx];
    }

    function doRandomise() {
      if (animating) return;
      animating = true;
      slotArea.innerHTML = "";

      const allOptions = config.fpOptions;
      const clOptions = allOptions.filter(function (o) {
        return o.group === "CL";
      });
      const jbOptions = allOptions.filter(function (o) {
        return o.group === "JB";
      });
      const otherOptions = allOptions.filter(function (o) {
        return o.group === "Other";
      });

      const noCL = appState.fs.tradCLChoice === "No CL";

      let chosenCL = null;
      if (!noCL) {
        chosenCL = randomFromArray(clOptions);
      }

      const hasCL96 = !!(chosenCL && chosenCL.clType === "cl96");

      let chosenJB = null;
      if (!hasCL96) {
        chosenJB = randomFromArray(jbOptions);
      }

      const chosenOther = randomFromArray(otherOptions);

      appState.fs.fpFinal = {
        cl: chosenCL ? chosenCL.label : null,
        jb: hasCL96
          ? "JB blocked (CL-96)"
          : chosenJB
          ? chosenJB.label
          : null,
        other: chosenOther ? chosenOther.label : null,
      };

      const labelRow = document.createElement("div");
      labelRow.className = "fp-slot-labels";

      const reelsRow = document.createElement("div");
      reelsRow.className = "accessory-reels";

      function buildSlot(labelText, itemLabels, targetLabel, staticLabel) {
        const labelSpan = document.createElement("span");
        labelSpan.textContent = labelText;
        labelRow.appendChild(labelSpan);

        const slot = document.createElement("div");
        slot.className = "slot-reel small";

        const windowEl = document.createElement("div");
        windowEl.className = "slot-window";

        slot.appendChild(windowEl);
        reelsRow.appendChild(slot);

        if (staticLabel) {
          const item = document.createElement("div");
          item.className = "slot-item";
          item.textContent = staticLabel;
          windowEl.appendChild(item);
        } else {
          itemLabels.forEach(function (name) {
            const item = document.createElement("div");
            item.className = "slot-item";
            item.textContent = name;
            windowEl.appendChild(item);
          });
          animateAccessoriesSlot(windowEl, itemLabels, targetLabel);
        }
      }

      if (!noCL) {
        const clNames = clOptions.map(function (o) {
          return o.label;
        });
        buildSlot(
          "CL",
          clNames,
          chosenCL ? chosenCL.label : clNames[0],
          null
        );
      }

      const jbNames = jbOptions.map(function (o) {
        return o.label;
      });
      if (hasCL96) {
        buildSlot("JB", [], null, "JB blocked (CL-96)");
      } else {
        buildSlot(
          "JB",
          jbNames,
          chosenJB ? chosenJB.label : jbNames[0],
          null
        );
      }

      const otherNames = otherOptions.map(function (o) {
        return o.label;
      });
      buildSlot(
        "Other",
        otherNames,
        chosenOther ? chosenOther.label : otherNames[0],
        null
      );

      slotArea.appendChild(labelRow);
      slotArea.appendChild(reelsRow);

      if (typeof onResolved === "function") {
        onResolved();
      }

      setTimeout(function () {
        animating = false;
      }, 1000);
    }

    const randomiseBtn = createPrimaryButton(
      "Randomise FP",
      doRandomise,
      config.palette.accent3
    );

    container.appendChild(title);
    container.appendChild(helper);
    container.appendChild(optionsStatic);
    container.appendChild(randomiseBtn);
    container.appendChild(slotArea);

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
      "Select P or FS to start. Everything else branches from here.";

    const buttonsRow = document.createElement("div");
    buttonsRow.className = "button-row";

    config.buttons.choice1.forEach(function (btnCfg) {
      const btn = createButtonFromConfig(btnCfg, function () {
        appState.path = btnCfg.id;
        if (btnCfg.id === "P") {
          appState.p.subChoice = null;
          appState.p.wheelResult = null;
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
      "Choose between S and D to move to the corresponding P wheel.";

    const buttonsRow = document.createElement("div");
    buttonsRow.className = "button-row";

    config.buttons.pSubChoice.forEach(function (btnCfg) {
      const btn = createButtonFromConfig(btnCfg, function () {
        appState.p.subChoice = btnCfg.id;
        appState.p.wheelResult = null;
        if (btnCfg.id === "S") {
          showPSWheel();
        } else {
          showPDWheel();
        }
      });
      buttonsRow.appendChild(btn);
    });

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const backBtn = createBackButton(function () {
      appState = resetAppState();
      showChoice1();
    });

    footer.appendChild(backBtn);

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(buttonsRow);
    card.appendChild(footer);

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
      "Spin to choose between JB, NHJ, TW and FL. Segment sizes match weights.";

    card.appendChild(title);
    card.appendChild(subtitle);

    createWheelComponent(card, config.wheels.pS, {
      spinLabel: "Spin S wheel",
      onResult: function (segment) {
        appState.p.wheelResult = segment.label;
        showResultOverlay(segment.label, function () {
          showFinalSummary();
        });
      },
    });

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const backBtn = createBackButton(showPSubChoice);
    footer.appendChild(backBtn);
    card.appendChild(footer);

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
      "Spin to choose between Oil+HE and No oil FP. Segment sizes reflect the weights.";

    card.appendChild(title);
    card.appendChild(subtitle);

    createWheelComponent(card, config.wheels.pD, {
      spinLabel: "Spin D wheel",
      onResult: function (segment) {
        appState.p.wheelResult = segment.label;
        showResultOverlay(segment.label, function () {
          showFinalSummary();
        });
      },
    });

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const backBtn = createBackButton(showPSubChoice);
    footer.appendChild(backBtn);
    card.appendChild(footer);

    setView(card);
  }

  // ---------- FS branch ----------

  function showFSInitialWheel() {
    // Reset FS branch state whenever we revisit the initial FS wheel
    appState.fs = {
      fsInitialOutcome: null,
      fsInitialKey: null,
      shibStyle: null,
      corsetDetail: null,
      tradCLChoice: null,
      fpFinal: { cl: null, jb: null, other: null },
      ffOutcome: null,
      location: null,
      accessoriesWheel: null,
      accessories: [],
    };

    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS branch – initial wheel";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Spin to go to Shib, outfit+delay, Oil or Trad. Segment proportions follow the weights.";

    card.appendChild(title);
    card.appendChild(subtitle);

    createWheelComponent(card, config.wheels.fsInitial, {
      spinLabel: "Spin FS wheel",
      onResult: function (segment) {
        appState.fs.fsInitialOutcome = segment.label;
        appState.fs.fsInitialKey = segment.key;
        showResultOverlay(segment.label, function () {
          if (segment.key === "shib") {
            showShibSubWheel();
          } else if (segment.key === "trad") {
            showTradCLChoice();
          } else {
            // outfit+delay or Oil
            showLocationWheel("fsInitial");
          }
        });
      },
    });

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const backBtn = createBackButton(function () {
      appState = resetAppState();
      showChoice1();
    });
    footer.appendChild(backBtn);
    card.appendChild(footer);

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
      onResult: function (segment) {
        appState.fs.shibStyle = segment.label;
        // Both Corset and Restrained now go to Sense-dep / BSC wheel
        showResultOverlay(segment.label, function () {
          showCorsetDetailWheel();
        });
      },
    });

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const backBtn = createBackButton(showFSInitialWheel);
    footer.appendChild(backBtn);
    card.appendChild(footer);

    setView(card);
  }

  function showCorsetDetailWheel() {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = "FS branch – Sense-dep / BSC";

    const subtitle = document.createElement("p");
    subtitle.className = "subtitle";
    subtitle.textContent =
      "Spin to decide between Sense-dep and BSC (4/6 split), then proceed to the FS terminus.";

    card.appendChild(title);
    card.appendChild(subtitle);

    creat
