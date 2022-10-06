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
})
