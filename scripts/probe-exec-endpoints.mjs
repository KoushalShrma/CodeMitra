const endpoints = [
  "https://emkc.org/api/v2/piston/execute",
  "https://piston.rs/api/v2/execute",
  "https://piston-api.pages.dev/api/v2/execute"
];
const body = {
  language: "python",
  version: "3.10.0",
  files: [{ content: "print(1)" }],
  stdin: ""
};

(async () => {
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const text = await res.text();
      console.log(`${endpoint} -> ${res.status} ${res.statusText}`);
      console.log(text.slice(0, 200));
      console.log("---");
    } catch (e) {
      console.log(`${endpoint} -> ERROR: ${e.message}`);
      console.log("---");
    }
  }
})();
