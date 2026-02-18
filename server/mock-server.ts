import http from "node:http";

const PORT = 19378;

// --- State ---

const user = {
  id: 1001,
  name: "Test User",
  email: "test@example.com",
  activeAccountId: 42,
};

let currentTimer: { isStarted: boolean; startTime?: string; details?: Record<string, unknown> } = {
  isStarted: false,
};

const scope = {
  projects: [
    { projectId: 101, projectName: "Project Alpha", isBillable: true, clientId: 1, clientName: "Client A" },
    { projectId: 102, projectName: "Project Beta", isBillable: false },
    { projectId: 103, projectName: "Internal Tasks", isBillable: false },
  ],
  tags: [
    { tagId: 201, tagName: "dev" },
    { tagId: 202, tagName: "design" },
  ],
  clients: [{ clientId: 1, clientName: "Client A" }],
};

const recentEntries = [
  {
    timeEntryId: 5001,
    startTime: "2026-01-15T09:00:00Z",
    endTime: "2026-01-15T10:30:00Z",
    details: { description: "Standup + planning", projectId: 101 },
    projectName: "Project Alpha",
  },
  {
    timeEntryId: 5002,
    startTime: "2026-01-15T10:45:00Z",
    endTime: "2026-01-15T12:00:00Z",
    details: { description: "Feature work", projectId: 102 },
    projectName: "Project Beta",
  },
];

// --- Helpers ---

function json(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
  });
}

function log(method: string, url: string, detail?: string) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${method} ${url}${detail ? ` → ${detail}` : ""}`);
}

// --- Router ---

const server = http.createServer(async (req, res) => {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";

  // GET /api/v3/user
  if (method === "GET" && url === "/api/v3/user") {
    log(method, url, user.name);
    return json(res, user);
  }

  // Account-scoped routes: /api/v3/accounts/:id/...
  const accountMatch = url.match(/^\/api\/v3\/accounts\/(\d+)\/(.+)$/);
  if (accountMatch) {
    const route = accountMatch[2];

    // GET /timer
    if (method === "GET" && route === "timer") {
      log(method, url, currentTimer.isStarted ? "running" : "stopped");
      return json(res, currentTimer);
    }

    // PUT /timer (start or stop)
    if (method === "PUT" && route === "timer") {
      const body = JSON.parse(await readBody(req));
      if (body.isStarted) {
        currentTimer = {
          isStarted: true,
          startTime: new Date().toISOString(),
          details: body.details ?? {},
        };
        log(method, url, `started: "${body.details?.description ?? "(no description)"}"`);
      } else {
        currentTimer = { isStarted: false };
        log(method, url, "stopped");
      }
      return json(res, currentTimer);
    }

    // GET /timeentries/recent
    if (method === "GET" && route === "timeentries/recent") {
      log(method, url, `${recentEntries.length} entries`);
      return json(res, recentEntries);
    }

    // GET /scope
    if (method === "GET" && route === "scope") {
      log(method, url, `${scope.projects.length} projects`);
      return json(res, scope);
    }
  }

  log(method, url, "404");
  json(res, { error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`\nTMetric mock server running on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  GET  /api/v3/user");
  console.log("  GET  /api/v3/accounts/:id/timer");
  console.log("  PUT  /api/v3/accounts/:id/timer");
  console.log("  GET  /api/v3/accounts/:id/timeentries/recent");
  console.log("  GET  /api/v3/accounts/:id/scope");
  console.log("");
});
