/*
 * LightningChartJS example that showcases a simulated ECG signal.
 */
// Import LightningChartJS
const lcjs = require('@lightningchart/lcjs')

// Import xydata
const xydata = require('@lightningchart/xydata')

// Extract required parts from LightningChartJS.
const { lightningChart, emptyFill, AxisScrollStrategies, AxisTickStrategies, UIElementBuilders, Themes } = lcjs

// Import data-generators from 'xydata'-library.s
const { createProgressiveTraceGenerator } = xydata

// Create a XY Chart.
const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .ChartXY({
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    })
    .setTitle('Custom X ticks with scrolling Axis')

// Create line series optimized for regular progressive X data.
const series = chart
    .addPointLineAreaSeries({
        dataPattern: 'ProgressiveX',
    })
    .setAreaFillStyle(emptyFill)
    .setMaxSampleCount(10_000)

// * Manage X Axis ticks with custom logic *
// Disable default X ticks.
const xAxis = chart.getDefaultAxisX().setTickStrategy(AxisTickStrategies.Empty)

const addCustomTickX = (pos, isMinor) => {
    const tick = xAxis
        .addCustomTick(isMinor ? UIElementBuilders.AxisTickMinor : UIElementBuilders.AxisTickMajor)
        // Set tick text.
        .setTextFormatter(() => String(pos))
        // Set tick location.
        .setValue(pos)
    customTicks.push(tick)
    return tick
}

// Create custom ticks on X Axis on realtime scrolling application.
let customTicks = []
const createTicksInRangeX = (start, end) => {
    // Major ticks every 500 units.
    const majorTickInterval = 500
    for (let majorTickPos = start - (start % majorTickInterval); majorTickPos <= end; majorTickPos += majorTickInterval) {
        if (majorTickPos >= start) {
            addCustomTickX(majorTickPos, false)
        }
    }
    // Major ticks every 100 units, but not at same interval as major ticks.
    const minorTickInterval = 100
    for (let minorTickPos = start - (start % minorTickInterval); minorTickPos <= end; minorTickPos += minorTickInterval) {
        if (minorTickPos >= start && minorTickPos % majorTickInterval !== 0) {
            addCustomTickX(minorTickPos, true)
        }
    }
}
// X range until which custom ticks are valid.
let customTicksPos = 0
xAxis.addEventListener('intervalchange', (event) => {
    const { start, end } = event
    // Ensure new ticks are created.
    if (end > customTicksPos) {
        createTicksInRangeX(customTicksPos, end)
        customTicksPos = end
    }

    // Destroy ticks that are out of scrolling range.
    customTicks = customTicks.filter((tick) => {
        if (tick.getValue() < start) {
            // Tick is out of view.
            tick.dispose()
            return false
        } else {
            return true
        }
    })
})

// Setup X Axis as progressive scrolling.
xAxis
    .setTitle('X Axis (custom ticks)')
    .setDefaultInterval((state) => ({ end: state.dataMax, start: (state.dataMax ?? 0) - 1400, stopAxisAfter: false }))
    .setScrollStrategy(AxisScrollStrategies.progressive)

chart.getDefaultAxisY().setTitle('Y Axis')

// Stream data in.
createProgressiveTraceGenerator()
    .setNumberOfPoints(10000)
    .generate()
    .setStreamRepeat(true)
    .setStreamInterval(1000 / 60)
    .setStreamBatchSize(5)
    .toStream()
    .forEach((point) => {
        series.add(point)
    })
