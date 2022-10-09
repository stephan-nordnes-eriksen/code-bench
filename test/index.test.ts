import { CodeBench } from "../src/index";

describe('CodeBench', () => {
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
	test('sanity tests', async () => {
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: true,
			maxItrTimeSeconds: 2
		})
		cb.task("fastest", () => {
			const a = 2*2
		})
		cb.task("slowest", () => {
			for (let index = 0; index < 200; index++) {
				const a = 2*2
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
			const a = 2*2
		})
		cb.task("slowest", () => {
			for (let index = 0; index < 200; index++) {
				const a = 2*2
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
			const a = 2*2
		})
		cb2.task("slowest", () => {
			for (let index = 0; index < 200; index++) {
				const a = 2*2
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
			const a = 2*2
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
			const a = 0
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
			const a = 0
		})
		await cb2.run()

		expect(consoleLogMockTwo)
			.not.toHaveBeenNthCalledWith(1, "CPU load is", expect.any(String), "at %:", expect.any(String))
	})
})
