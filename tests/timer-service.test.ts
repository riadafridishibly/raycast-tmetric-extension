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
  });

  describe("getProjects", () => {
    it("fetches projects from account scope", async () => {
      const projects = await service.getProjects();
      expect(projects).toHaveLength(3);
      expect(projects[0].projectName).toBe("Project Alpha");
      expect(projects[1].projectName).toBe("Project Beta");
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
