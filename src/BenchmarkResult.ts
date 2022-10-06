import { Task } from "./Task";

export type BenchmarkResult = {
	task: Task;
	taskName: string;
	totalCalls: number;
	opsPerSecondRaw: number;
	opsPerSecond?: string;
	stdDevRaw: number;
	stdDev?: string;
	totalTimeRaw: number;
	totalTime?: string;
	meanTimeRaw: number;
	meanTime?: string;
	minTimeRaw: number;
	minTime?: string;
	maxTimeRaw: number;
	maxTime?: string;
	dropped: number;
	rank: number;
};
