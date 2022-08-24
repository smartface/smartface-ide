export const writeError = (err, header)  => {
    var msg =
      "├─ ️‼️ ──────────── " + (header || "Dispatcher Error") + "  ──────────────────" +
      (err.file ? "\n├─ file ─ " + err.file : "") +
      "\n├─ » " + (err.stack ? err.stack.toString("binary") : err.toString("binary"))
      .replace(/\n/ig, "\n├─ » ")
      .replace(/Error:/g, "\t");
    // logToDispatcher("error", msg);
    console.error(msg);
  };