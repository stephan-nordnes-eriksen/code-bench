import { CodeBench } from "../src/index";

describe('CodeBench', () => {
	test('maxItrCount', async () => {
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
		})
		let itrCount = 0
		cb.task("test a", () => {
			itrCount += 1
		})
		await cb.run()
		expect(itrCount).toBe(2) // 1 x warmup
	})
	test('maxItrCount many', async () => {
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 10,
		})
		let itrCount = 0
		cb.task("test a", () => {
			itrCount += 1
		})
		await cb.run()
		expect(itrCount).toBe(11) // 1 x warmup
	})

	test('shutdown', async () => {
		let executionCount = 0
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			startup: async () => {
				executionCount = executionCount + 1
			}
		})
		let testFailed = false
		cb.task("test a", () => {
			if(executionCount !== 1){
				testFailed = true
			}
		})
		cb.task("test a", () => {
			if(executionCount !== 1){
				testFailed = true
			}
		})
		expect(executionCount).toBe(0)
		await cb.run()
		expect(testFailed).toBe(false)
		expect(executionCount).toBe(1)
	})
	test('cleanup', async () => {
		let executionCount = 0
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			cleanup: async () => {
				executionCount = executionCount + 1
			}
		})
		let testFailed = false
		cb.task("test a", () => {
			if(executionCount !== 0){
				testFailed = true
			}
		})
		await cb.run()
		expect(testFailed).toBe(false)
		expect(executionCount).toBe(1)
	})
	test('cleanup between', async () => {
		let executionCount = 0
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			cleanup: async () => {
				executionCount = executionCount + 1
			}
		})
		let testFailed = false
		cb.task("test a", () => {
			if(executionCount !== 0){
				testFailed = true
			}
		})
		cb.task("test a", () => {
			if(executionCount !== 1){
				testFailed = true
			}
		})
		await cb.run()
		expect(testFailed).toBe(false)
		expect(executionCount).toBe(2)
	})

	test('shutdown', async () => {
		let executionCount = 0
		const cb = new CodeBench({
			silent: true,
			dynamicIterationCount: false,
			maxItrCount: 1,
			shutdown: async () => {
				executionCount = executionCount + 1
			}
		})
		let testFailed = false
		cb.task("test a", () => {
			if(executionCount !== 0){
				testFailed = true
			}
		})
		cb.task("test a", () => {
			if(executionCount !== 0){
				testFailed = true
			}
		})
		await cb.run()
		expect(testFailed).toBe(false)
		expect(executionCount).toBe(1)
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
			maxItrTimeSeconds: 1,
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
			maxItrTimeSeconds: 1,
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
