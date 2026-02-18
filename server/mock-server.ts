import http from "node:http";

const PORT = 19378;

// --- State ---

const user = {
  id: 1001,
  name: "Test User",
  email: "test@example.com",
  activeAccountId: 42,
};

let latestEntry: {
  id: number;
  startTime: string;
  endTime: string | null;
  project: { id: number; name: string } | null;
  note: string;
  tags: { id: number; name: string }[];
  isBillable: boolean;
} | null = null;

let nextEntryId = 5000;

const projects = [
  { id: 101, name: "Project Alpha", client: { id: 1, name: "Client A" }, status: "active" },
  { id: 102, name: "Project Beta", status: "active" },
  { id: 103, name: "Internal Tasks", status: "active" },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const timeEntries = [
  { id: 1, startTime: daysAgo(1), endTime: daysAgo(1), project: { id: 101, name: "Project Alpha" }, note: "Standup + planning", tags: [], isBillable: false },
  { id: 2, startTime: daysAgo(2), endTime: daysAgo(2), project: { id: 101, name: "Project Alpha" }, note: "standup + planning", tags: [], isBillable: false },
  { id: 3, startTime: daysAgo(3), endTime: daysAgo(3), project: { id: 102, name: "Project Beta" }, note: "Feature work", tags: [], isBillable: false },
  { id: 4, startTime: daysAgo(5), endTime: daysAgo(5), project: { id: 102, name: "Project Beta" }, note: "Feature work", tags: [], isBillable: false },
  { id: 5, startTime: daysAgo(7), endTime: daysAgo(7), project: { id: 102, name: "Project Beta" }, note: "Feature work", tags: [], isBillable: false },
  { id: 6, startTime: daysAgo(4), endTime: daysAgo(4), project: null, note: "", tags: [], isBillable: false },
  { id: 7, startTime: daysAgo(6), endTime: daysAgo(6), project: { id: 103, name: "Internal Tasks" }, note: "Code review", tags: [], isBillable: false },
];

const recentEntries = [
  {
    project: { id: 101, name: "Project Alpha" },
    task: null,
    note: "Standup + planning",
    tags: [],
    isBillable: false,
    isPinned: false,
  },
  {
    project: { id: 102, name: "Project Beta" },
    task: null,
    note: "Feature work",
    tags: [],
    isBillable: false,
    isPinned: false,
  },
];

// --- Helpers ---

function json(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", reject);
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

  try {
    // GET /api/v3/user
    if (method === "GET" && url === "/api/v3/user") {
      log(method, url, user.name);
      return json(res, user);
    }

    // Account-scoped routes: /api/v3/accounts/:id/...
    const accountMatch = url.match(/^\/api\/v3\/accounts\/(\d+)\/(.+)$/);
    if (accountMatch) {
      const route = accountMatch[2];

      // GET /timeentries/latest
      if (method === "GET" && route === "timeentries/latest") {
        log(method, url, latestEntry ? (latestEntry.endTime == null ? "running" : "stopped") : "empty");
        if (!latestEntry) {
          res.writeHead(204);
          res.end();
          return;
        }
        return json(res, latestEntry);
      }

      // POST /timeentries (start timer)
      if (method === "POST" && route === "timeentries") {
        let body: Record<string, unknown>;
        try {
          body = JSON.parse(await readBody(req));
        } catch {
          log(method, url, "400 bad JSON");
          return json(res, { error: "Invalid JSON body" }, 400);
        }

        const project = body.project as { id: number } | null;
        const matchedProject = project ? projects.find((p) => p.id === project.id) : null;

        latestEntry = {
          id: nextEntryId++,
          startTime: new Date().toISOString(),
          endTime: null,
          project: matchedProject ? { id: matchedProject.id, name: matchedProject.name } : null,
          note: (body.note as string) ?? "",
          tags: [],
          isBillable: (body.isBillable as boolean) ?? false,
        };
        log(method, url, `started: "${latestEntry.note}"`);
        return json(res, latestEntry);
      }

      // POST /timeentries/break (stop timer)
      if (method === "POST" && route === "timeentries/break") {
        if (latestEntry && latestEntry.endTime == null) {
          latestEntry = { ...latestEntry, endTime: new Date().toISOString() };
        }
        log(method, url, "stopped");
        res.writeHead(204);
        res.end();
        return;
      }

      // GET /timeentries/recent
      if (method === "GET" && route === "timeentries/recent") {
        log(method, url, `${recentEntries.length} entries`);
        return json(res, recentEntries);
      }

      // GET /timeentries/projects
      if (method === "GET" && route === "timeentries/projects") {
        log(method, url, `${projects.length} projects`);
        return json(res, projects);
      }

      // GET /timeentries?startDate=...&endDate=...
      if (method === "GET" && route.startsWith("timeentries?")) {
        const params = new URLSearchParams(route.split("?")[1]);
        const startDate = params.get("startDate");
        const endDate = params.get("endDate");
        const filtered = timeEntries.filter((e) => {
          const t = new Date(e.startTime).getTime();
          const start = startDate ? new Date(startDate).getTime() : 0;
          const end = endDate ? new Date(endDate + "T23:59:59.999Z").getTime() : Infinity;
          return t >= start && t <= end;
        });
        log(method, url, `${filtered.length} entries`);
        return json(res, filtered);
      }
    }

    log(method, url, "404");
    json(res, { error: "Not found" }, 404);
  } catch (err) {
    log(method, url, `500 ${err}`);
    json(res, { error: "Internal server error" }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`\nTMetric mock server running on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  GET  /api/v3/user");
  console.log("  GET  /api/v3/accounts/:id/timeentries/latest");
  console.log("  POST /api/v3/accounts/:id/timeentries");
  console.log("  POST /api/v3/accounts/:id/timeentries/break");
  console.log("  GET  /api/v3/accounts/:id/timeentries/recent");
  console.log("  GET  /api/v3/accounts/:id/timeentries/projects");
  console.log("  GET  /api/v3/accounts/:id/timeentries?startDate=&endDate=");
  console.log("");
});
