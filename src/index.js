/*
 * LightningChartJS example that showcases a simulated ECG signal.
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Extract required parts from LightningChartJS.
const {
    lightningChart,
    DataPatterns,
    AxisScrollStrategies,
    SolidLine,
    SolidFill,
    ColorHEX,
    AutoCursorModes,
    AxisTickStrategies,
    Themes,
} = lcjs

// Import data-generators from 'xydata'-library.
const {
    createProgressiveTraceGenerator
} = require('@arction/xydata')

// Create a XY Chart.
const chart = lightningChart().ChartXY({
    // theme: Themes.dark 
})
    .setTitle('Custom X ticks with scrolling Axis')

// Add line series to visualize the data received
const series = chart.addLineSeries({ dataPattern: DataPatterns.horizontalProgressive })
// Style the series
series
    .setStrokeStyle(new SolidLine({
        thickness: 2,
        fillStyle: new SolidFill({ color: ColorHEX('#5aafc7') })
    }))
    .setMouseInteractions(false)

chart.setAutoCursorMode(AutoCursorModes.disabled)

// * Manage X Axis ticks with custom logic *
// Disable default X ticks.
const xAxis = chart.getDefaultAxisX()
    .setTickStrategy(AxisTickStrategies.Empty)

// Define style for custom ticks.
const gridStrokeStyleMajor = new SolidLine({ thickness: 1, fillStyle: new SolidFill({ color: ColorHEX('#fff').setA(100) }) })
const gridStrokeStyleMinor = new SolidLine({ thickness: 1, fillStyle: new SolidFill({ color: ColorHEX('#fff').setA(50) }) })
const backgroundStrokeStyle = new SolidLine({ thickness: 1, fillStyle: new SolidFill({color: ColorHEX('#fff').setA(50)}) })

const addCustomTickX = (pos, isMinor) => {
    const tick = xAxis.addCustomTick()
        // Set tick text.
        .setTextFormatter(() => String(pos))
        // Set tick location.
        .setValue(pos)
        // Style tick.
        .setMarker(marker => marker
            .setFont(font => font
                .setSize( isMinor ? 12 : 14 )
            )
            .setBackground(background => background
                .setStrokeStyle(backgroundStrokeStyle)
                // "tick length" as pixels.
                .setPointerLength(6)
            )
        )
        .setGridStrokeStyle(isMinor ? gridStrokeStyleMinor : gridStrokeStyleMajor)
    customTicks.push(tick)
    return tick
}

// Create custom ticks on X Axis on realtime scrolling application.
let customTicks = []
const createTicksInRangeX = (start, end) => {
    // Major ticks every 1000 units.
    const majorTickInterval = 1000
    for (let majorTickPos = start - (start % majorTickInterval); majorTickPos <= end; majorTickPos += majorTickInterval) {
        if (majorTickPos >= start) {
            addCustomTickX(majorTickPos, false)
        }
    }
    // Major ticks every 500 units, but not at same interval as major ticks.
    const minorTickInterval = 500
    for (let minorTickPos = start - (start % minorTickInterval); minorTickPos <= end; minorTickPos += minorTickInterval) {
        if (minorTickPos >= start && minorTickPos % majorTickInterval !== 0) {
            addCustomTickX(minorTickPos, true)
        }
    }
}
// X range until which custom ticks are valid.
let customTicksPos = 0
xAxis.onScaleChange((start, end) => {
    // Ensure new ticks are created.
    if (end > customTicksPos) {
        createTicksInRangeX(customTicksPos, end)
        customTicksPos = end
    }

    // Destroy ticks that are out of scrolling range.
    customTicks = customTicks.filter(tick => {
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
    .setInterval(0, 1400)
    .setScrollStrategy(AxisScrollStrategies.progressive)

chart.getDefaultAxisY()
    .setTitle('Y Axis')


// Stream data in.
createProgressiveTraceGenerator()
    .setNumberOfPoints(10000)
    .generate()
    .setStreamRepeat(true)
    .setStreamInterval(1000/60)
    .setStreamBatchSize(5)
    .toStream()
    .forEach(point => {
        series.add(point)
    })