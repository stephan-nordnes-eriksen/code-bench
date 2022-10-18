import { BenchmarkResult } from './BenchmarkResult'
import { CPUAnalysis } from './CPUAnalysis';
import { Task } from "./Task"

// From MDN docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
const AsyncFunction = Object.getPrototypeOf(async function () {/* Intentionally left blank */ }).constructor;

/** Constructor Class for AsyncBenchmark */
interface BenchmarkConfig {
	silent?: boolean
	allowRuntimeOptimizations?: boolean
	disableCPUAnalysis?: boolean
	maxItrCount?: number
	maxItrTimeSeconds?: number
	targetLoopTimeSeconds?: number
	dynamicIterationCount?: boolean
	dropOutliers?: boolean
	/** Run after fully run task */
	cleanup?: () => void
	/** Run before all tasks */
	startup?: () => void
	/** Run after all tasks */
	shutdown?: () => void
}

export class CodeBench {
	tasks: Task[] = []
	silent = false
	allowRuntimeOptimizations = false
	disableCPUAnalysis = false
	maxItrTimeNS = 5e9
	maxItrCount = 2000000
	cleanup?: () => void
	startup?: () => void
	shutdown?: () => void
	targetLoopRuntime = 5e8 // 0.5 seconds in ns
	dynamicIterationCount = false
	dropOutliers = true

	constructor({
		silent = false,
		allowRuntimeOptimizations = false,
		disableCPUAnalysis = false,
		maxItrCount = 2000000,
		maxItrTimeSeconds = 5,
		targetLoopTimeSeconds = 0.5,
		dynamicIterationCount = true,
		dropOutliers = true,
		cleanup,
		startup,
		shutdown,
	}: BenchmarkConfig = {}) {
		this.silent = silent
		this.allowRuntimeOptimizations = allowRuntimeOptimizations
		this.disableCPUAnalysis = disableCPUAnalysis
		this.maxItrCount = maxItrCount
		this.maxItrTimeNS = maxItrTimeSeconds * 1e9
		this.cleanup = cleanup
		this.startup = startup
		this.shutdown = shutdown
		this.targetLoopRuntime = targetLoopTimeSeconds * 1e9
		this.dynamicIterationCount = dynamicIterationCount
		this.dropOutliers = dropOutliers
	}
	private getNS() {
		const nsNow = process.hrtime()
		return this.nsFromHrtime(nsNow)
	}
	private nsFromHrtime(hrtimeObject: [number, number]) {
		return hrtimeObject[0] * 1e9 + hrtimeObject[1]
	}
	private sortBenchmarkResults(a: BenchmarkResult, b: BenchmarkResult): number {
		if (a.opsPerSecondRaw < b.opsPerSecondRaw) {
			return 1
		}
		if (a.opsPerSecondRaw > b.opsPerSecondRaw) {
			return -1
		}
		return 0
	}
	private calculatePerf(task: Task, failure: boolean, filter_outliers = true): BenchmarkResult {
		if (failure) {
			return {
				task: task,
				taskName: "*failed* " + task.name,
				opsPerSecondRaw: 0,
				totalCalls: 0,
				totalTimeRaw: 0,
				stdDevRaw: 0,
				meanTimeRaw: 0,
				minTimeRaw: 0,
				maxTimeRaw: 0,
				rank: 0,
				dropped: 0,
			}
		}
		if (task.timings.length < 1) {
			return {
				task: task,
				taskName: "*no timings* " + task.name,
				opsPerSecondRaw: 0,
				totalCalls: 0,
				totalTimeRaw: 0,
				stdDevRaw: 0,
				meanTimeRaw: 0,
				minTimeRaw: 0,
				maxTimeRaw: 0,
				rank: 0,
				dropped: 0,
			}
		}
		let min = Number.MAX_VALUE
		let max = -1
		let sum = 0
		let droppedSum = 0
		let sumOperations = 0
		task.timings.forEach(time => {
			if (time.dropped) {
				droppedSum += 1
				return
			}
			time.total = (time.stop - time.start) / 1e9
			if (time.total > max) {
				max = time.total
			}
			if (time.total < min) {
				min = time.total
			}
			sum += time.total
			sumOperations += time.operations
		})
		const mean = sum / sumOperations
		const stdDevSquared = task.timings.reduce(
			(total, timing) => {
				if (timing.dropped) {
					return total
				}
				return total + Math.pow(timing.total - mean, 2)
			}, 0) / (task.timings.length - droppedSum)
		const stdDev = Math.sqrt(stdDevSquared)
		if (filter_outliers) {
			const limit = stdDev * 3 // My statisticsfoo is poor... maybe 3 sigma?
			let someDropped = false
			task.timings.map(tm => {
				tm.dropped = Math.abs(tm.total - mean) > limit
				someDropped = someDropped || tm.dropped
			})
			if (someDropped) {
				return this.calculatePerf(task, failure, false)
			}
		}

		const completeTotalTime = (task.timings[task.timings.length - 1].stop - task.timings[0].start) / 1e9

		return {
			task: task,
			taskName: task.name,
			opsPerSecondRaw: (sumOperations / completeTotalTime),
			opsPerSecond: (sumOperations / completeTotalTime).toFixed(3),
			totalCalls: sumOperations,
			totalTimeRaw: completeTotalTime,
			totalTime: completeTotalTime.toFixed(3) + "s",
			stdDevRaw: stdDev,
			stdDev: stdDev.toExponential(3),
			meanTimeRaw: mean,
			meanTime: mean.toExponential(3) + "s",
			minTimeRaw: min,
			minTime: min.toExponential(3) + "s",
			maxTimeRaw: max,
			maxTime: max.toExponential(3) + "s",
			rank: 0,
			dropped: droppedSum,
		}
	}
	private printResultPreview(result: BenchmarkResult) {
		console.log(result.task.name, result.opsPerSecond, "ops/sec ±", result.stdDev, "min/max/mean:", [result.minTime, result.maxTime, result.meanTime].join("/"), "(", result.totalCalls, "runs sampled )")
	}
	task(name: string, fn: () => void): void {
		// store scope here? Maybe the scope is preserved?
		this.tasks.push(new Task(
			name,
			fn
		))
	}
	async run(): Promise<BenchmarkResult[]> {
		if (this.tasks.length <= 0) {
			if (!this.silent) {
				console.log("No tasks detected. Please add tasks with .task(name, function)")
			}
			return []
		}
		// Disable optimizations, for more stable runs
		// Line below can apparently be used to disable optimizations in node, with --allow-natives-syntax
		// % NeverOptimizeFunction(run);

		// Old with-statement will apparently disable some optimizations, but is deprecated
		// with({});
		if (!this.allowRuntimeOptimizations) {
			// Eval empty string will apparently disable a lot of optimizations.
			eval('')

			// Empty try-catch will apparently disable optimizations
			try {/* Intentionally left blank */ } catch (e) {/* Intentionally left blank */ }
		}

		if (!this.disableCPUAnalysis && !this.silent) {
			await CPUAnalysis.printCpuInformation()
		}

		if (this.startup) {
			await Promise.resolve(this.startup()).catch(error => {
				console.error("Error with startup function")
				console.error(error)
			})
		}
		let internalLoop = Math.max(1, Math.floor(this.maxItrCount / 100))
		const results: BenchmarkResult[] = []
		for (let taskIndex = 0; taskIndex < this.tasks.length; taskIndex++) {
			const task = this.tasks[taskIndex];
			let failure = false
			try {
				if (this.dynamicIterationCount) {
					internalLoop = await this.getEstimateInnerLoopSize(task);
				} else {
					// single warmup
					task.fn()
				}
			} catch (error) {
				console.error(error)
				failure = true
			}

			const startTime = this.getNS()
			let itrCount = 0
			// TODO: Consider running the methods in a randomized order will likely make the
			// tests even more robust to variances in runtime
			let loopStartTime = process.hrtime()
			let loopStopTime = process.hrtime()
			while (!failure && (this.dynamicIterationCount || itrCount < this.maxItrCount) && (this.getNS() - startTime) < this.maxItrTimeNS) {
				try {
					if (this.allowRuntimeOptimizations) {
						loopStartTime = process.hrtime()
						for (let i = 0; i < internalLoop; i++) {
							await task.fn()
						}
						loopStopTime = process.hrtime()
						task.timings.push({
							start: this.nsFromHrtime(loopStartTime),
							stop: this.nsFromHrtime(loopStopTime),
							dropped: false,
							operations: internalLoop,
							total: 0
						})
					} else {
						const functionUniqueness = this.getNS()
						const fnstr = this.generateRunnerMethodString(functionUniqueness, internalLoop)

						// Creating a new async function from a string to prevent a number of js optimizations,
						// causing unreliable/unstable tests
						const newFn = new AsyncFunction(fnstr)

						// Release stuff from event loop which could impact performance
						await Promise.resolve()

						// Pre assign variables to prevent memory allocation latencies

						const timings = await newFn.call(task.fn)
						timings.forEach((timeObje: { start: [number, number], stop: [number, number] }) => {
							task.timings.push({
								start: this.nsFromHrtime(timeObje.start),
								stop: this.nsFromHrtime(timeObje.stop),
								dropped: false,
								operations: internalLoop,
								total: 0
							})
						})
					}
					itrCount += internalLoop
				} catch (error) {
					failure = true
					console.error(error)
				}

			}
			if (this.allowRuntimeOptimizations && global.gc) {
				global.gc()
			}
			const taskResult = this.calculatePerf(task, failure, this.dropOutliers)
			if (!this.silent) {
				this.printResultPreview(taskResult)
			}
			results.push(taskResult)
			if (this.cleanup) {
				await Promise.resolve(this.cleanup()).catch(error => {
					console.error("Error with cleanup function")
					console.error(error)
				})
			}
		}
		const resultsCopy = [...results]
		resultsCopy.sort(this.sortBenchmarkResults)
		resultsCopy.forEach((res, index) => {
			res.rank = index + 1
		})
		if (!this.silent) {
			console.table(results, [
				"taskName",
				"opsPerSecond",
				"rank",
				"totalCalls",
				"totalTime",
				"stdDev",
				"meanTime",
				"minTime",
				"maxTime",
				"dropped",
			])
		}
		if (this.shutdown) {
			await Promise.resolve(this.shutdown()).catch(error => {
				console.error("Error with shutdown function")
				console.error(error)
			})
		}
		return results
	}

	/**
	 * Estimates number of loops required to achieve 0.5s runtime (default)
	 *
	 * This will run the provided task until the desired targetLoopTime is reached
	 * and return the number of times the function was run, min 1
	 *
	 * @param task Task to estimate loop count for
	 * @returns Number of loops required to roughly get desired runtime for task
	 */
	private async getEstimateInnerLoopSize(task: Task) {
		let rampUpCount = 0
		const rampUpStart = this.getNS()
		while (this.getNS() - rampUpStart < this.targetLoopRuntime) {
			await task.fn()
			rampUpCount += 1
		}
		return Math.max(rampUpCount, 1)
	}

	/**
	 * Generates the string required for running the benchmarking.
	 *
	 * NOTES:
	 * We want to generate a function from a string in order to prevent JS optimizations
	 * such as caching of variables and the likes. This method is not fool proof, but
	 * should apparently give more consistent results.
	 *
	 * It would we even better to stringify the input method, but I have not found any way
	 * to bring along the context, so any variables from outside the direct scope
	 * of the function will be lost. eg. let a = 2: bm.add("test", ()=>{var b = a + 2;})
	 *
	 * @param functionUniqueness unique id for the function
	 * @param internalLoop Number of times the internal loop will run the provided function
	 * @returns
	 */
	private generateRunnerMethodString(functionUniqueness: string | number, internalLoop: number) {
		// Pre assign variables startTime/stopTIme to prevent memory allocation latencies
		return `eval(''); try {} catch(e) {}; f${functionUniqueness} = this;\
			const result = [];\
			let startTime = process.hrtime();\
			let stopTime = process.hrtime();\
			startTime = process.hrtime();\
			for(var i = 0; i < ${internalLoop}; i++ ) {\
				await f${functionUniqueness}();\
			};\
			stopTime = process.hrtime();\
			result.push({start: startTime, stop: stopTime});\
			return result`;
	}
}
