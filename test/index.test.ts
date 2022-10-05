import { CodeBench } from "../src/index";

describe('CodeBench', () => {
	test('constructor', async () => {
		const cb = new CodeBench()
		expect(cb).toBeTruthy()
	})
	test('cleanup', async () => {
		let hasCleanupBeenExcuted = false
		const cb = new CodeBench({
			cleanup: async () => {
				hasCleanupBeenExcuted = true
			}
		})
		let testFailed = false
		cb.task("test a", () => {
			if(hasCleanupBeenExcuted){
				testFailed = true
			}
		})
		await cb.run()
		expect(testFailed).toBe(false)
		expect(hasCleanupBeenExcuted).toBe(true)
	})
	test('cleanup between', async () => {
		let hasCleanupBeenExcuted = 0
		const cb = new CodeBench({
			cleanup: async () => {
				hasCleanupBeenExcuted = hasCleanupBeenExcuted + 1
			}
		})
		let testFailed = false
		cb.task("test a", () => {
			if(hasCleanupBeenExcuted !== 0){
				testFailed = true
			}
		})
		cb.task("test a", () => {
			if(hasCleanupBeenExcuted !== 1){
				testFailed = true
			}
		})
		await cb.run()
		expect(testFailed).toBe(false)
		expect(hasCleanupBeenExcuted).toBe(2)
	})
})
