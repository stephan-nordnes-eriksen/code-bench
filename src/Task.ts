import { TimeStamp } from "./TimeStamp";


export class Task {
	timings: TimeStamp[] = [];
	constructor(public name: string, public fn: () => void) {
	}
}
