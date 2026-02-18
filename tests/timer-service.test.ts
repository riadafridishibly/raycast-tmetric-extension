import { describe, it, expect, beforeEach } from "vitest";
import { TimerService } from "../src/services/timer-service";
import { TMetricApiMock } from "./mock/tmetric-api-mock";

describe("TimerService", () => {
  let mock: TMetricApiMock;
  let service: TimerService;

  beforeEach(() => {
    mock = new TMetricApiMock();
    service = new TimerService(mock);
  });

  describe("getAccountId", () => {
    it("resolves account ID from user profile", async () => {
      const accountId = await service.getAccountId();
      expect(accountId).toBe(42);
      expect(mock.calls).toHaveLength(1);
      expect(mock.calls[0].method).toBe("getUser");
    });

    it("caches account ID across calls", async () => {
      await service.getAccountId();
      await service.getAccountId();
      // getUser should only be called once
      const getUserCalls = mock.calls.filter((c) => c.method === "getUser");
      expect(getUserCalls).toHaveLength(1);
    });
  });

  describe("startTimer", () => {
    it("starts a timer with description", async () => {
      await service.startTimer({ description: "Working on feature X" });

      const startCalls = mock.calls.filter((c) => c.method === "startTimer");
      expect(startCalls).toHaveLength(1);
      expect(startCalls[0].args[0]).toBe(42);
      expect(startCalls[0].args[1]).toEqual({ description: "Working on feature X" });
    });

    it("starts a timer with project", async () => {
      await service.startTimer({ description: "Bug fix", projectId: 101 });

      const startCalls = mock.calls.filter((c) => c.method === "startTimer");
      expect(startCalls[0].args[1]).toEqual({ description: "Bug fix", projectId: 101 });
    });
  });

  describe("stopTimer", () => {
    it("stops the running timer", async () => {
      await service.startTimer({ description: "Task" });
      await service.stopTimer();

      const stopCalls = mock.calls.filter((c) => c.method === "stopTimer");
      expect(stopCalls).toHaveLength(1);
      expect(stopCalls[0].args[0]).toBe(42);
    });
  });

  describe("getStatus", () => {
    it("returns not running when no timer is active", async () => {
      const status = await service.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.description).toBeUndefined();
    });

    it("returns running status with details after starting", async () => {
      await service.startTimer({ description: "Deep work", projectId: 101 });
      const status = await service.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.description).toBe("Deep work");
      expect(status.projectName).toBe("Project Alpha");
      expect(status.elapsedSeconds).toBeGreaterThanOrEqual(0);
    });

    it("returns not running after stop", async () => {
      await service.startTimer({ description: "Quick task" });
      await service.stopTimer();
      const status = await service.getStatus();

      expect(status.isRunning).toBe(false);
    });

    it("returns undefined projectName when projectId is not in scope", async () => {
      await service.startTimer({ description: "Unknown project", projectId: 999 });
      const status = await service.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.projectName).toBeUndefined();
    });

    it("returns running status without projectName when no projectId set", async () => {
      await service.startTimer({ description: "No project" });
      const status = await service.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.description).toBe("No project");
      expect(status.projectName).toBeUndefined();
    });
  });

  describe("getProjects", () => {
    it("fetches projects from account scope", async () => {
      const projects = await service.getProjects();
      expect(projects).toHaveLength(3);
      expect(projects[0].name).toBe("Project Alpha");
      expect(projects[1].name).toBe("Project Beta");
    });
  });

  describe("getDescriptionSuggestions", () => {
    it("deduplicates by note (case-insensitive) and counts occurrences", async () => {
      const suggestions = await service.getDescriptionSuggestions();
      const standupSuggestion = suggestions.find((s) => s.description.toLowerCase().includes("standup"));
      expect(standupSuggestion).toBeDefined();
      expect(standupSuggestion!.count).toBe(2);
    });

    it("preserves casing from the most recent occurrence", async () => {
      const suggestions = await service.getDescriptionSuggestions();
      const standupSuggestion = suggestions.find((s) => s.description.toLowerCase().includes("standup"));
      // The most recent entry (1 day ago) has "Standup + planning" (capital S)
      expect(standupSuggestion!.description).toBe("Standup + planning");
    });

    it("filters out empty and whitespace-only notes", async () => {
      const suggestions = await service.getDescriptionSuggestions();
      const emptyNotes = suggestions.filter((s) => s.description.trim() === "");
      expect(emptyNotes).toHaveLength(0);
    });

    it("trims whitespace from notes", async () => {
      const suggestions = await service.getDescriptionSuggestions();
      const codeReview = suggestions.find((s) => s.description === "Code review");
      expect(codeReview).toBeDefined();
    });

    it("tracks count correctly for entries appearing multiple times", async () => {
      const suggestions = await service.getDescriptionSuggestions();
      const featureWork = suggestions.find((s) => s.description === "Feature work");
      expect(featureWork).toBeDefined();
      expect(featureWork!.count).toBe(3);
    });

    it("sorts by most recently used first", async () => {
      const suggestions = await service.getDescriptionSuggestions();
      // "Standup + planning" (1 day ago) should come before "Feature work" (3 days ago)
      const standupIdx = suggestions.findIndex((s) => s.description.toLowerCase().includes("standup"));
      const featureIdx = suggestions.findIndex((s) => s.description === "Feature work");
      expect(standupIdx).toBeLessThan(featureIdx);
    });

    it("associates lastProject from the most recent occurrence", async () => {
      const suggestions = await service.getDescriptionSuggestions();
      const standupSuggestion = suggestions.find((s) => s.description.toLowerCase().includes("standup"));
      expect(standupSuggestion!.lastProject).toEqual({ id: 101, name: "Project Alpha" });
    });

    it("returns correct number of unique descriptions", async () => {
      const suggestions = await service.getDescriptionSuggestions();
      // "Standup + planning" (x2), "Feature work" (x3), "Code review" (x1) = 3 unique
      expect(suggestions).toHaveLength(3);
    });

    it("returns empty array when no entries have notes", async () => {
      mock.timeEntries = [
        {
          id: 100,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          project: null,
          note: "",
          tags: [],
          isBillable: false,
        },
      ];
      const suggestions = await service.getDescriptionSuggestions();
      expect(suggestions).toHaveLength(0);
    });
  });

  describe("full workflow", () => {
    it("start → status → stop → status", async () => {
      // Start
      await service.startTimer({ description: "Integration test", projectId: 102 });

      // Check status while running
      const runningStatus = await service.getStatus();
      expect(runningStatus.isRunning).toBe(true);
      expect(runningStatus.description).toBe("Integration test");
      expect(runningStatus.projectName).toBe("Project Beta");

      // Stop
      await service.stopTimer();

      // Check status after stopping
      const stoppedStatus = await service.getStatus();
      expect(stoppedStatus.isRunning).toBe(false);
    });
  });
});
