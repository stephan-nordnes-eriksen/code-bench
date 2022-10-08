import { cpus } from "os"

class CPUStatus {
	user = 0
	nice = 0
	sys = 0
	idle = 0
	irq = 0

	/**
	 * Returns sum of total time spent.
	 * @returns sum of all time
	 */
	total(): number {
		return this.user + this.nice + this.sys + this.irq + this.idle
	}
	/**
	 * Return total cpu load in the timeframe between this and other.

	 * @param other CPUStatus from after timeout
	 */
	getLoad(other: CPUStatus): number {
		const idle = other.idle - this.idle
		const total = other.total() - this.total()

		return 1 - (idle / total)
	}
}

export class CPUAnalysis {
	static async printCpuInformation(): Promise<void> {
		const cpuLoad = await CPUAnalysis.getLoadFromTime()
		let cpuLoadString = ""
		switch (true) {
		case cpuLoad <= 0.1:
			cpuLoadString = "low"
			break
		case cpuLoad <= 0.3:
			cpuLoadString = "medium"
			break
		case cpuLoad <= 0.6:
			cpuLoadString = "high"
			break
		case cpuLoad <= 0.9:
			cpuLoadString = "very high"
			break
		default:
			cpuLoadString = "critically high"
			break
		}
		console.log("CPU load is", cpuLoadString, "at %:", (cpuLoad * 100).toFixed(2))
	}

	static getCPUInfo(): CPUStatus{
		const cpusNow = cpus()
		const status = new CPUStatus()
		cpusNow.forEach(cpu => {
			status.user += cpu.times.user
			status.nice += cpu.times.nice
			status.sys += cpu.times.sys
			status.idle += cpu.times.idle
			status.irq += cpu.times.irq
		})

		return status
	}

	static async getLoadFromTime(timeInSeconds = 1): Promise<number> {
		return new Promise(resolve => {
			const cpuStateNow = CPUAnalysis.getCPUInfo()
			setTimeout(() => {
				const cpuStateAfter = CPUAnalysis.getCPUInfo()
				resolve(cpuStateNow.getLoad(cpuStateAfter))
			}, (timeInSeconds * 1000))
		})
	}
}

