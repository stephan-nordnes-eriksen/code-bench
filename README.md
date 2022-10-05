# code-bench

code-bench aims at being a [stable](#key-concepts) JavaScript profiling tool, providing reliable benchmarking numbers.

# Install

`npm install code-bench`

# Usage

```javascript
import CB from 'code-bench'

let options = {
	// see Options below for available settings
}
let benchmark = new CB(options)
benchmark.task("test name 1", async () => {
	// First test case
	let a = 2*2
})
benchmark.task("test name 2", async () => {
	// Second test case
	let a = 2<<1
})

benchmark.run().then(result => {
	// run will print a table to console,
	// but you also receive all the results here
	result.forEach(res => {
		console.log(res.name, res.rank)
	})
})

```

# Options

```javascript
const options = {
	silent?: boolean
		// default = false. Prints results to console
	maxItrCount?: number
		// default: 2 000 000. Target total number of calls to task function.
	maxItrTimeSeconds?: number
		// default: 5. Maximum amount of total time per task.
	targetLoopTimeSeconds?: number
		// default: 0.5. used together with dynamicIterationCount to achieve dynamic test runs.
	dynamicIterationCount?: boolean
		// default = true. Each test case will first be estimated, then it will attempt to run in increments of `targetLoopTimeSeconds` increments.
	cleanup?: () => void
		// Callback (async or sync) run after fully run task
	startup?: () => void
		// Callback (async or sync) run before all tasks
	shutdown?: () => void
		// Callback (async or sync) run after all tasks
}
```

# Key concepts

code-bench aims at being a stable benchmarking tool. But what does that mean?

1. Repeatability: Benchmarks should result is almost identical results if you run the same benchmark multiple times. This is surprisingly difficult to achieve.
2. Comparability: It should be possible to compare the results from one test case to another.


# Things to keep in mind when benchmarking

- Run isolated: Benchmark results are invalid if the running computer has a lot of other processes running at the same time. For best results, set the process-priority of the benchmark to 20.
- CPU design: Some processors has "boost" technology, which allows it to run very fast in short bursts, but then it becomes warm and has to "throttle", meaning it slows down. If you run a large test case, this throttling will most likely make earlier test cases seem faster than normal, and later ones slower.
- JavaScript has many optimizations built in, and will try to optimize the runtime of your code. code-bench utilizes multiple strategies to prevent this from happening in order to achieve stable results, but the individual JavaScript engines will behave differently, and they will most likely change with time.
- Because code-bench tries to disable runtime optimizations, your code will most likely run faster in real-world scenarios. To run tests without the optimization-prevention, run with option `allowRuntimeOptimizations` set to `true`, **but be warned**; your test results will be very unstable. Numbers between test runs cannot be reliably compared, and even test cases from the same run cannot truly be compared with each other.

## License
MIT
