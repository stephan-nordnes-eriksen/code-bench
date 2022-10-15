import { CodeBench } from "../src"
import { CPUAnalysis } from "../src/CPUAnalysis"

describe('CPUAnalysis', () => {
	test('getLoadFromTime', async () => {
		const loadTime = await CPUAnalysis.getLoadFromTime()
		expect(loadTime).toBeGreaterThanOrEqual(0)
		expect(loadTime).toBeLessThanOrEqual(1)
	})
	test('low cpu load full stack', async () => {
		const consoleLogMock = jest.fn()
		console.log = consoleLogMock
		const loadTimeMock = jest.fn()
		CPUAnalysis.getLoadFromTime = loadTimeMock
		loadTimeMock.mockResolvedValue(0.01)
		const cb = new CodeBench({
			silent: false,
			dynamicIterationCount: false,
			allowRuntimeOptimizations: true,
			disableCPUAnalysis: false,
			maxItrCount: 1,
		})
		cb.task("test", () => {
			let a = 0
			if(a){
				a = 1
			} else {
				a = 2
			}
		})
		await cb.run()

		expect(consoleLogMock)
			.toHaveBeenNthCalledWith(1, "CPU load is", "low", "at %:", "1.00")
	})

	test('medium cpu load', async () => {
		const consoleLogMock = jest.fn()
		console.log = consoleLogMock
		const loadTimeMock = jest.fn()
		CPUAnalysis.getLoadFromTime = loadTimeMock
		loadTimeMock.mockResolvedValue(0.15)

		await CPUAnalysis.printCpuInformation()

		expect(consoleLogMock)
			.toHaveBeenNthCalledWith(1, "CPU load is", "medium", "at %:", "15.00")
	})
	test('high cpu load', async () => {
		const consoleLogMock = jest.fn()
		console.log = consoleLogMock
		const loadTimeMock = jest.fn()
		CPUAnalysis.getLoadFromTime = loadTimeMock
		loadTimeMock.mockResolvedValue(0.4)

		await CPUAnalysis.printCpuInformation()

		expect(consoleLogMock)
			.toHaveBeenNthCalledWith(1, "CPU load is", "high", "at %:", "40.00")
	})

	test('very high cpu load', async () => {
		const consoleLogMock = jest.fn()
		console.log = consoleLogMock
		const loadTimeMock = jest.fn()
		CPUAnalysis.getLoadFromTime = loadTimeMock
		loadTimeMock.mockResolvedValue(0.7)

		await CPUAnalysis.printCpuInformation()

		expect(consoleLogMock)
			.toHaveBeenNthCalledWith(1, "CPU load is", "very high", "at %:", "70.00")
	})

	test('critically high cpu load', async () => {
		const consoleLogMock = jest.fn()
		console.log = consoleLogMock
		const loadTimeMock = jest.fn()
		CPUAnalysis.getLoadFromTime = loadTimeMock
		loadTimeMock.mockResolvedValue(0.95)

		await CPUAnalysis.printCpuInformation()

		expect(consoleLogMock)
			.toHaveBeenNthCalledWith(1, "CPU load is", "critically high", "at %:", "95.00")
	})
})
