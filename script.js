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

        fpFinal: [],
        ffOutcome: null,

        location: null,
        accessoriesWheel: null,
        accessories: [],
      },
    };
  }

  function setView(contentEl) {
    const root = document.getEle
