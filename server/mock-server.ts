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
  console.log("");
});
