import { CodeBench } from "../src/index";
import { Task } from "../src/Task";
import { TimeStamp } from "../src/TimeStamp";
import { BenchmarkResult } from "../src/BenchmarkResult";
describe('CodeBench', () => {
	test('silly tests to get coverage', () => {
		const cb = new CodeBench({})
		expect(cb).not.toBe(undefined)
		const cbTwo = new CodeBench()
		expect(cbTwo).not.toBe(undefined)
	})
	test('maxItrCount', async () => {
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
		})
		const testA = jest.fn()
		cb.task("test a", testA)
		await cb.run()
		expect(testA).toBeCalledTimes(2) // 1 x warmup
	})
	test('maxItrCount many', async () => {
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 10,
		})
		const testA = jest.fn()
		cb.task("test a", testA)
		await cb.run()
		expect(testA).toBeCalledTimes(11) // 1 x warmup
	})

	test('startup', async () => {
		const startupFunction = jest.fn()
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			startup: startupFunction
		})
		const testA = jest.fn()
		const testB = jest.fn()
		cb.task("test a", () => {
			testA()
			expect(testB).not.toBeCalled()
			expect(startupFunction).toBeCalledTimes(1)
		})
		cb.task("test b", () => {
			testB()
			expect(startupFunction).toBeCalledTimes(1)
		})
		expect(startupFunction).not.toBeCalled()
		await cb.run()
		expect(startupFunction).toBeCalledTimes(1)
	})

	test('startup failing', async () => {
		// Most startups do
		const consoleMock = jest.fn()
		console.error = consoleMock
		const startupFunction = jest.fn()
		const errorMock = jest.fn()
		startupFunction.mockRejectedValue(errorMock)
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			startup: startupFunction
		})
		const taskA = jest.fn()
		cb.task("test a", taskA)
		expect(startupFunction).not.toBeCalled()
		await cb.run()
		expect(startupFunction).toBeCalledTimes(1)
		expect(taskA).toBeCalled()
		expect(consoleMock).toHaveBeenCalledTimes(2)
		expect(consoleMock).toHaveBeenNthCalledWith(1, "Error with startup function")
		expect(consoleMock).toHaveBeenNthCalledWith(2, errorMock)
	})

	test('cleanup', async () => {
		const cleanupFunction = jest.fn()
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			cleanup: cleanupFunction
		})
		const taskA = jest.fn()
		cb.task("test a", () => {
			taskA()
			expect(cleanupFunction).not.toBeCalled()
		})
		expect(cleanupFunction).not.toBeCalled()
		await cb.run()
		expect(cleanupFunction).toBeCalledTimes(1)
		expect(taskA).toBeCalled()
	})
	test('cleanup failing', async () => {
		const consoleMock = jest.fn()
		console.error = consoleMock
		const cleanupFunction = jest.fn()
		const errorMock = jest.fn()
		cleanupFunction.mockRejectedValue(errorMock)
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			cleanup: cleanupFunction
		})
		const taskA = jest.fn()
		cb.task("test a", () => {
			taskA()
			expect(cleanupFunction).not.toBeCalled()
		})
		expect(cleanupFunction).not.toBeCalled()
		await cb.run()
		expect(cleanupFunction).toBeCalledTimes(1)
		expect(taskA).toBeCalled()
		expect(consoleMock).toHaveBeenCalledTimes(2)
		expect(consoleMock).toHaveBeenNthCalledWith(1, "Error with cleanup function")
		expect(consoleMock).toHaveBeenNthCalledWith(2, errorMock)
	})

	test('cleanup between', async () => {
		const cleanupFunction = jest.fn()
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			cleanup: cleanupFunction
		})
		const taskA = jest.fn()
		const taskB = jest.fn()

		cb.task("test a", () => {
			taskA()
			expect(cleanupFunction).not.toBeCalled()
		})
		cb.task("test b", () => {
			taskB()
			expect(cleanupFunction).toBeCalledTimes(1)
		})
		expect(cleanupFunction).not.toBeCalled()
		await cb.run()
		expect(cleanupFunction).toBeCalledTimes(2)
		expect(taskA).toBeCalled()
		expect(taskB).toBeCalled()
	})

	test('shutdown', async () => {
		const shutdownFunction = jest.fn()
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			shutdown: shutdownFunction
		})
		const taskA = jest.fn()
		const taskB = jest.fn()
		cb.task("test a", () => {
			taskA()
			expect(shutdownFunction).not.toBeCalled()
		})
		cb.task("test b", () => {
			taskB()
			expect(shutdownFunction).not.toBeCalled()
		})
		expect(shutdownFunction).not.toBeCalled()
		await cb.run()
		expect(shutdownFunction).toBeCalledTimes(1)
		expect(taskA).toBeCalled()
		expect(taskB).toBeCalled()
	})

	test('shutdown failing', async () => {
		const consoleMock = jest.fn()
		console.error = consoleMock
		const shutdownFunction = jest.fn()
		const errorMock = jest.fn()
		shutdownFunction.mockRejectedValue(errorMock)
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			shutdown: shutdownFunction
		})
		const taskA = jest.fn()
		cb.task("test a", taskA)
		expect(shutdownFunction).not.toBeCalled()
		await cb.run()
		expect(shutdownFunction).toBeCalledTimes(1)
		expect(taskA).toBeCalled()
		expect(consoleMock).toHaveBeenCalledTimes(2)
		expect(consoleMock).toHaveBeenNthCalledWith(1, "Error with shutdown function")
		expect(consoleMock).toHaveBeenNthCalledWith(2, errorMock)
	})


	test('sanity tests', async () => {
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: true,
			maxItrTimeSeconds: 2
		})
		cb.task("fastest", () => {
			let a = 2 * 2
			if (a) {
				a = 2
			}
		})
		cb.task("slowest", () => {
			for (let index = 0; index < 200; index++) {
				let a = 2 * 2
				if (a) {
					a = 2
				}
			}
		})
		const results = await cb.run()

		expect(results[0].rank).toBe(1)
		expect(results[1].rank).toBe(2)
		expect(results[0]?.opsPerSecondRaw).toBeGreaterThan(results[1]?.opsPerSecondRaw)
	})
	test('allowRuntimeOptimizations', async () => {
		const cb = new CodeBench({
			silent: false,
			dynamicIterationCount: true,
			allowRuntimeOptimizations: true,
			targetLoopTimeSeconds: 0.1,
			maxItrTimeSeconds: 0.5,
		})
		cb.task("fastest", () => {
			let a = 2 * 2
			if (a) {
				a = 2
			}
		})
		cb.task("slowest", () => {
			for (let index = 0; index < 200; index++) {
				let a = 2 * 2
				if (a) {
					a = 2
				}
			}
		})
		const results = await cb.run()


		expect(results[0].rank).toBe(1)
		expect(results[1].rank).toBe(2)
		expect(results[0]?.opsPerSecondRaw).toBeGreaterThan(results[1]?.opsPerSecondRaw)

		const cb2 = new CodeBench({
			silent: false,
			dynamicIterationCount: true,
			allowRuntimeOptimizations: false,
			targetLoopTimeSeconds: 0.1,
			maxItrTimeSeconds: 0.5,
		})
		cb2.task("fastest", () => {
			let a = 2 * 2
			if (a) {
				a = 2
			}
		})
		cb2.task("slowest", () => {
			for (let index = 0; index < 200; index++) {
				let a = 2 * 2
				if (a) {
					a = 2
				}
			}
		})
		const results2 = await cb2.run()


		expect(results2[0].rank).toBe(1)
		expect(results2[1].rank).toBe(2)
		expect(results2[0]?.opsPerSecondRaw).toBeGreaterThan(results2[1]?.opsPerSecondRaw)

		// Comparing methods
		expect(results[0]?.opsPerSecondRaw).toBeGreaterThan(results2[0]?.opsPerSecondRaw)
		expect(results[1]?.opsPerSecondRaw).toBeGreaterThan(results2[1]?.opsPerSecondRaw)
	})
	test('silent', async () => {
		const consoleLogMock = jest.fn()
		console.log = consoleLogMock
		const cb = new CodeBench({
			silent: false,
			maxItrCount: 1,
			dynamicIterationCount: false,
		})
		cb.task("test task", () => {
			let a = 2 * 2
			if (a) {
				a = 2
			}
		})
		cb.run()
		expect(consoleLogMock.mock.calls).toEqual([])
	})
	test('disableCPUAnalysis', async () => {
		const consoleLogMock = jest.fn()
		console.log = consoleLogMock
		const cb = new CodeBench({
			silent: false,
			dynamicIterationCount: false,
			allowRuntimeOptimizations: true,
			disableCPUAnalysis: false,
			maxItrCount: 1,
		})
		cb.task("test", () => {
			let a = 0
			if (a) {
				a = 2
			}
		})
		await cb.run()

		expect(consoleLogMock)
			.toHaveBeenNthCalledWith(1, "CPU load is", expect.any(String), "at %:", expect.any(String))

		const consoleLogMockTwo = jest.fn()
		console.log = consoleLogMockTwo
		const cb2 = new CodeBench({
			silent: false,
			dynamicIterationCount: false,
			allowRuntimeOptimizations: true,
			disableCPUAnalysis: true,
			maxItrCount: 1,
		})
		cb2.task("test", () => {
			let a = 0
			if (a) {
				a = 2
			}
		})
		await cb2.run()

		expect(consoleLogMockTwo)
			.not.toHaveBeenNthCalledWith(1, "CPU load is", expect.any(String), "at %:", expect.any(String))
	})

	test('failing task', async () => {
		const consoleTableMock = jest.fn()
		console.table = consoleTableMock
		const cb = new CodeBench({
			silent: false,
			dynamicIterationCount: false,
			allowRuntimeOptimizations: true,
			disableCPUAnalysis: false,
			maxItrCount: 1,
		})
		cb.task("test", () => {
			throw Error("Example error")
		})

		await cb.run() // not throw error

		expect(consoleTableMock).toBeCalledWith([
			expect.objectContaining({
				"taskName": "*failed* test",
			})], [
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
	})
	test('failing task after warmup', async () => {
		const consoleTableMock = jest.fn()
		const consoleErrorMock = jest.fn()
		console.error = consoleErrorMock
		console.table = consoleTableMock
		const cb = new CodeBench({
			silent: false,
			dynamicIterationCount: false,
			allowRuntimeOptimizations: true,
			disableCPUAnalysis: false,
			maxItrCount: 1,
		})
		let counter = 0
		const tracker = jest.fn()
		const errorMock = jest.fn()

		cb.task("test", () => {
			if(counter > 0){
				tracker()
				throw errorMock
			}
			counter += 1
		})

		await cb.run() // not throw error
		expect(tracker).toBeCalled()
		expect(consoleErrorMock).toBeCalledWith(errorMock)
		expect(consoleTableMock).toBeCalledWith([
			expect.objectContaining({
				"taskName": "*failed* test",
			})], [
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
	})
	test('run without tasks', async () => {
		const consoleTableMock = jest.fn()
		const consoleLogMock = jest.fn()
		console.log = consoleLogMock
		console.table = consoleTableMock
		const cb = new CodeBench({
			silent: false,
			dynamicIterationCount: false,
			allowRuntimeOptimizations: true,
			disableCPUAnalysis: false,
			maxItrCount: 1,
		})

		await cb.run() // not throw error
		expect(consoleLogMock).toBeCalledWith("No tasks detected. Please add tasks with .task(name, function)")
	})
	describe("calculatePerf", () => {
		let cb: CodeBench;
		beforeAll(() => {
			cb = new CodeBench({
				silent: false,
				dynamicIterationCount: false,
				allowRuntimeOptimizations: true,
				disableCPUAnalysis: false,
				maxItrCount: 1,
			})
		})
		test("dropped", () => {
			const task = new Task("test task 1", () => {/* */ })
			const timeStamp = new TimeStamp()
			timeStamp.start = 0
			timeStamp.stop = 1e8
			timeStamp.operations = 1

			const timeStampSlow = new TimeStamp()
			timeStampSlow.start = 0
			timeStampSlow.stop = 1e12
			timeStampSlow.operations = 1

			task.timings = [
				timeStamp,
				timeStamp,
				timeStamp,
				timeStamp,
				timeStamp,
				timeStamp,
				timeStamp,
				timeStamp,
				timeStamp,
				timeStamp,
				timeStamp, // 11 timeStamps
				timeStampSlow
			]
			const result = cb["calculatePerf"](task, false, true)
			expect(result.dropped).toBe(1)
			expect(result.stdDevRaw).toBeCloseTo(0)
			const resultDefault = cb["calculatePerf"](task, false)
			expect(resultDefault.dropped).toBe(1)
			expect(resultDefault.stdDevRaw).toBeCloseTo(0)

			timeStamp.dropped = false
			timeStampSlow.dropped = false
			const resultTwo = cb["calculatePerf"](task, false, false)
			expect(resultTwo.dropped).toBe(0)
			expect(resultTwo.stdDevRaw).toBeCloseTo(276.35776065636)
		})
		test("failed", () => {
			const task = new Task("test task 1", () => {/* */ })
			const timeStamp = new TimeStamp()
			timeStamp.start = 0
			timeStamp.stop = 1e8
			timeStamp.operations = 1

			task.timings = [
				timeStamp,
			]
			const result = cb["calculatePerf"](task, true, true)
			expect(result.taskName).toBe("*failed* test task 1")
			expect(result.opsPerSecondRaw).toBe(0)
			expect(result.totalCalls).toBe(0)
			expect(result.totalTimeRaw).toBe(0)
			expect(result.stdDevRaw).toBe(0)
			expect(result.meanTimeRaw).toBe(0)
			expect(result.minTimeRaw).toBe(0)
			expect(result.maxTimeRaw).toBe(0)
			expect(result.rank).toBe(0)
			expect(result.dropped).toBe(0)
		})
		test("empty timings", () => {
			const task = new Task("test task 1", () => {/* */ })
			const timeStamp = new TimeStamp()
			timeStamp.start = 0
			timeStamp.stop = 1e8
			timeStamp.operations = 1

			task.timings = []
			const result = cb["calculatePerf"](task, false, true)
			expect(result.taskName).toBe("*no timings* test task 1")
			expect(result.opsPerSecondRaw).toBe(0)
			expect(result.totalCalls).toBe(0)
			expect(result.totalTimeRaw).toBe(0)
			expect(result.stdDevRaw).toBe(0)
			expect(result.meanTimeRaw).toBe(0)
			expect(result.minTimeRaw).toBe(0)
			expect(result.maxTimeRaw).toBe(0)
			expect(result.rank).toBe(0)
			expect(result.dropped).toBe(0)
		})
	})
	test("with gc", async () => {
		const cb = new CodeBench({
			dynamicIterationCount: false,
			allowRuntimeOptimizations: true,
			disableCPUAnalysis: true,
			maxItrCount: 1,
		})
		const gcMock = jest.fn()
		global.gc = gcMock
		const testA = jest.fn()
		cb.task("test a", testA)
		expect(gcMock).not.toHaveBeenCalled()
		await cb.run()
		expect(gcMock).toHaveBeenCalled()
	})
	test("sortBenchmarkResults", () => {
		const cb = new CodeBench({
			dynamicIterationCount: false,
			allowRuntimeOptimizations: true,
			disableCPUAnalysis: true,
			maxItrCount: 1,
		})
		const taskFunction = jest.fn()
		const task = new Task("name", taskFunction)
		const resultHigh: BenchmarkResult = {
			task: task,
			taskName: "name",
			totalCalls: 1,
			opsPerSecondRaw: 1,
			stdDevRaw: 1,
			totalTimeRaw: 1,
			meanTimeRaw: 1,
			minTimeRaw: 1,
			maxTimeRaw: 1,
			dropped: 1,
			rank: 1,
		}
		const resultLow: BenchmarkResult = {
			task: task,
			taskName: "name",
			totalCalls: 0,
			opsPerSecondRaw: 0,
			stdDevRaw: 0,
			totalTimeRaw: 0,
			meanTimeRaw: 0,
			minTimeRaw: 0,
			maxTimeRaw: 0,
			dropped: 0,
			rank: 0,
		}
		expect(cb["sortBenchmarkResults"](resultHigh, resultLow)).toBe(-1)
		expect(cb["sortBenchmarkResults"](resultLow, resultHigh)).toBe(1)
		expect(cb["sortBenchmarkResults"](resultHigh, resultHigh)).toBe(0)
		expect(cb["sortBenchmarkResults"](resultLow, resultLow)).toBe(0)

	})
})
