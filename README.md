[![npm version](https://badge.fury.io/js/code-bench.svg)](https://badge.fury.io/js/code-bench)
[![GitHub issues](https://img.shields.io/github/issues/stephan-nordnes-eriksen/code-bench)](https://github.com/stephan-nordnes-eriksen/code-bench/issues)
[![GitHub license](https://img.shields.io/github/license/stephan-nordnes-eriksen/code-bench)](https://github.com/stephan-nordnes-eriksen/code-bench/blob/main/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/stephan-nordnes-eriksen/code-bench/badge.svg?branch=main)](https://coveralls.io/github/stephan-nordnes-eriksen/code-bench?branch=main)
# code-bench
> Currently only works for node.js

Benchmarking suite for async and sync js code providing stable results.

code-bench aims at being a [stable](#key-concepts) JavaScript profiling tool, providing reliable benchmarking numbers.

# Install

```sh
npm install code-bench --save-dev
```

# Usage

```typescript
import { CodeBench } from "code-bench"

const options = {
	// see Options below for available settings
}
const benchmark = new CodeBench(options)
benchmark.task("test name 1", async () => {
	// First test case
	let a = 2*2
})
benchmark.task("test name 2", async () => {
	// Second test case
	let a = 2<<1
})
benchmark.task("test name 3", async () => {
	// Third test case fails
	throw new Error("Some error occurred")
})

benchmark.run().then(benchmarkResults => {
	// run will print a table to console,
	// but you also receive all the results here
	benchmarkResults.forEach(result => {
		console.log(result.taskName, "ops/s:", result.opsPerSecond, "rank:", result.rank)
	})
})
```

## Example output
(note, some numbers (stdDev, minTime, maxTime, dropped) currently show stats for task loops, not individual tasks. )

```shell
CPU load is low at %: 0.72
test name 1 26683185.089 ops/sec ± 1.676e+1% min/max/mean: 1.589e-1s/1.836e-1s/3.744e-8s ( 134247120 runs sampled )
test name 2 27462584.248 ops/sec ± 1.654e+1% min/max/mean: 1.612e-1s/1.807e-1s/3.637e-8s ( 140922466 runs sampled )
Error: Some error occurred
    at Task.fn (example.js:20:8)
test name 3 undefined ops/sec ± undefined min/max/mean: // ( 0 runs sampled )
┌─────────┬────────────────────────┬────────────────┬──────┬────────────┬───────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────┐
│ (index) │        taskName        │  opsPerSecond  │ rank │ totalCalls │ totalTime │   stdDev    │  meanTime   │   minTime   │   maxTime   │ dropped │
├─────────┼────────────────────────┼────────────────┼──────┼────────────┼───────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────┤
│    0    │     'test name 1'      │ '26683185.089' │  2   │ 134247120  │ '5.031s'  │ '1.676e+1%' │ '3.744e-8s' │ '1.589e-1s' │ '1.836e-1s' │    0    │
│    1    │     'test name 2'      │ '27462584.248' │  1   │ 140922466  │ '5.131s'  │ '1.654e+1%' │ '3.637e-8s' │ '1.612e-1s' │ '1.807e-1s' │    0    │
│    2    │ '*failed* test name 3' │                │  3   │     0      │           │             │             │             │             │    0    │
└─────────┴────────────────────────┴────────────────┴──────┴────────────┴───────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
test name 1 ops/s: 26683185.089 rank: 2
test name 2 ops/s: 27462584.248 rank: 1
*failed* test name 3 ops/s: undefined rank: 3 3
```

# Results
By default all the results will be printed to the console output. The results are also returned as an array of [BenchmarkResults](src/BenchmarkResult.ts), and contain all the raw data and the printed ones.

- (index): The order
- taskName: Name of the task
- opsPerSecond: Number of times per second the task has run.
- rank: The overall ranking of the task. 1 = fastest.
- totalCalls: Total number of times the function was called while being measured. (Tasks usually run more times in order to warm up and be estimated)
- totalTime: Total amount of time that the task was running for. (sum all runs)
- stdDev: The standard deviation between task loops runs.
- meanTime: Mean (averag) time per task.
- minTime: Minimum time for a task. (Currently tracked per task loop, not per task)
- maxTime: Maximum time for a task. (Currently tracked per task loop, not per task)
- dropped: Number of dropped data tasks (task loops right now). By default code-bench drops outliers (> 3 sigma).

# Options

```javascript
const options = {
	silent?: boolean
		// default = false. Prevents prints results to console if true.
	allowRuntimeOptimizations?: boolean
		// default: false. If true, will run test without most optimization prevention techniques.
		// Result; Performance numbers matches real world more closely, but numbers are less comparable with other runs (not stable).
	disableCPUAnalysis?: boolean
		// default: false. If true, will disable printing information on current CPU load (nodejs only).
	maxItrCount?: number
		// default: 2 000 000. Target total number of calls to each task function.
	maxItrTimeSeconds?: number
		// default: 5. Target maximum amount of total time per task.
	targetLoopTimeSeconds?: number
		// default: 0.5. Target total time per task loop (see below). Used together with dynamicIterationCount.
	dynamicIterationCount?: boolean
		// default = true. If true, dynamically set iteration count based on an estimation of task performance.
	dropOutliers?: boolean
		// default = true. If true, task runs that has a greater than 3 sigma error will be dropped.
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
3. Accuracy: The numbers you read should be close to what you would see if running outside of the benchmark. Unfortunately code-bench usually reports poorer performance than you can expect from a task "in the real world". This is a tradeoff to improve the above two concepts.
4. Failure Safe: If a task fails, the whole benchmarking run should not fail.

# Things to keep in mind when benchmarking

- Run isolated: Benchmark results are invalid if the running computer has a lot of other processes running at the same time. For best results, set the process-priority of the benchmark to 20.
- CPU design: Some processors has "boost" technology, which allows it to run very fast in short bursts, but then it becomes warm and has to "throttle", meaning it slows down. If you run a large test case, this throttling will most likely make earlier test cases seem faster than normal, and later ones slower.
- JavaScript has many optimizations built in, and will try to optimize the runtime of your code. code-bench utilizes multiple strategies to prevent this from happening in order to achieve stable results, but the individual JavaScript engines will behave differently, and they will most likely change with time.
- Because code-bench tries to disable runtime optimizations, your code will most likely run faster in real-world scenarios. To run tests without the optimization-prevention, run with option `allowRuntimeOptimizations` set to `true`, **but be warned**; your test results will be more unstable. Numbers between test runs cannot be as reliably compared, and even test cases from the same run cannot truly be compared with each other.

# Under the hood

## Preventing Javascript Optimizations

JavaScript engines has many types of optimizations built in. These will usually greatly increase the performance of your code, but it makes the resulting performance not deterministic. Because of this, code-bench uses several techniques to attempt to prevent these optimizations. This will make most code slower than it would be in the real world, but the results are more deterministic, and thus comparing one run to another is possible with more confidence. code-bench does allow this feature to be turned of with the `allowRuntimeOptimizations` set to `true`, but this is not recommended for most use cases.

## Task Loops

Even though code-bench uses nanosecond timings, the act of measuring itself is not perfectly accurate. Because of this code-bench will run each task a number of times in a loop before measuring the time. Essentially something similar to `var start = now(); for(var i = 0; i < loopCount; i++){task()}; var end = now()`. The default behavior is that code-bench will estimate the performance of a task and then tune the loop count accordingly. By default code-bench tries to run each task in loops of 0.5 seconds (`targetLoopTimeSeconds`) for a total of 5 seconds (`maxItrTimeSeconds`).


## License

MIT
