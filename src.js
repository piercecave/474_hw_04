'use strict';

var state = {
    "legendary": "All",
    "generation": "All",
    "ogData": "none",
    "tooltipDiv": "none"
}

const small_msm = {
    width: 500,
    height: 500,
    marginAll: 50,
    marginLeft: 80
}

// Use d3 to process data and call plotting function
const initializePlot = () => {
    d3.csv("gapminder.csv", plotData);
}

// Creates and displays axes, labels, and histogram
const plotData = (data) => {

    const marginTop = 48,
        marginRight = 48,
        marginBottom = 48,
        marginLeft = 48;

    const width = 768 - marginLeft - marginRight;
    const height = 464 - marginTop - marginBottom;

    const svg = createSVG(width, height, marginLeft, marginRight, marginTop, marginBottom);

    state.ogData = data;

    data = data.filter(function (d) { return !(d["fertility"] == "NA") && d["year"] == 1980 });

    const x = createAndPlotXAxis(svg, data, width, height);

    const y = createAndPlotYAxis(svg, data, height);

    const tooltip = createTooltip();

    update(svg, data, x, y, tooltip);
}

// Uses d3 to create the svg element
const createSVG = (width, height, marginLeft, marginRight, marginTop, marginBottom) => {
    return d3.select("#scatterPlotContainer")
        .append("svg")
        .attr("width", width + marginLeft + marginRight)
        .attr("height", height + marginTop + marginBottom)
        .append("g")
        .attr("transform",
            "translate(" + marginLeft + "," + marginTop + ")");
}

// Creates an x scale, appends an axis to our svg element, and labels the axis
const createAndPlotXAxis = (svg, data, width, height) => {

    const x = d3.scaleLinear()
        .domain([d3.min(data, function (d) { return +d["fertility"] }) * .9, d3.max(data, function (d) { return +d["fertility"] }) * 1.1])
        .range([0, width]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)).attr("class", "myXaxis");



    svg.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            (height + 36) + ")")
        .style("text-anchor", "middle")
        .text("Fertility");

    return x;
}

// Creates an y scale, appends an axis to our svg element, and labels the axis
const createAndPlotYAxis = (svg, data, height) => {

    const y = d3.scaleLinear()
        .domain([d3.min(data, function (d) { return +d["life_expectancy"] }) * .7, d3.max(data, function (d) { return +d["life_expectancy"] }) * 1.3])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y)).attr("class", "myYaxis");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -48)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Life Expectancy");

    return y;
}

// Creates tooltip
const createTooltip = () => {

    state.tooltipDiv = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "6px");

    const tooltip = state.tooltipDiv
        .append('svg')
        .attr('width', small_msm.width)
        .attr('height', small_msm.height);

    return tooltip;
}

// Updates scatter plot
const update = (svg, filteredData, x, y, tooltip) => {

    x.domain([d3.min(filteredData, function (d) { return +d["fertility"] }) * .9, d3.max(filteredData, function (d) { return +d["fertility"] }) * 1.1])

    svg.selectAll(".myXaxis").transition()
        .duration(3000)
        .call(d3.axisBottom(x));

    y.domain([d3.min(filteredData, function (d) { return +d["life_expectancy"] }) * .7, d3.max(filteredData, function (d) { return +d["life_expectancy"] }) * 1.3]);

    svg.selectAll(".myYaxis")
        .transition()
        .duration(3000)
        .call(d3.axisLeft(y));

    var plot = svg.selectAll(".markers")
        .data(filteredData);

    var enter = plot
        .enter()
        .append("circle")
        .attr("class", 'markers')
        .attr("cx", function (d) { return x(d["fertility"]); })
        .attr("cy", function (d) { return y(d["life_expectancy"]); })
        .attr("r", 3)
        .on("mouseover", (d) => { mouseover(d, tooltip) })
        .on("mousemove", (d) => { mousemove(d, tooltip, filteredData) })
        .on("mouseleave", (d) => { mouseleave(d, tooltip) })
        .filter(function (d) { return d.population > 1000; })
        .append("p")

    svg.selectAll(".country_labels")
        .data(filteredData)
        .enter()
        .filter(function (d) { return d.population > 100000000 } )
        .append("text")
        .attr("class", "country_labels")
        .text(function (d) { return d.country })
        .attr("x", function (d) { return x(d["fertility"]) + 20; })
        .attr("y", function (d) { return y(d["life_expectancy"]) + 5; });

    plot.merge(enter).transition().duration(3000)
        .attr("cx", function (d) { return x(d["fertility"]); })
        .attr("cy", function (d) { return y(d["life_expectancy"]); })

    plot
        .exit()
        .remove();
}

const mouseover = (d, tooltip) => {
    state.tooltipDiv
        .style("opacity", 1)
}

const mousemove = (d, tooltip, data) => {
    state.tooltipDiv
        .style("left", (d3.event.pageX + 60) + "px")
        .style("top", (d3.event.pageY - 30) + "px");

    tooltip.selectAll("*").remove();

    plotPopulationOverTime(tooltip, d["country"]);
}

function plotPopulationOverTime(tooltip, country) {
    let countryData = state.ogData.filter((row) => { return row.country == country && row.population != "NA" })

    let year = countryData.map((row) => parseInt(row["year"]));
    let population = countryData.map((row) => parseInt(row["population"] / 1000000));

    let axesLimits = findMinMax(year, population);
    let mapFunctions = drawAxes(axesLimits, "year", "population", tooltip, small_msm);

    tooltip.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return mapFunctions.xScale(d.year) })
            .y(function (d) { return mapFunctions.yScale(d.population / 1000000) }))

    makeLabels(tooltip, small_msm, "Population Over Time For " + country, "Year", "Population (in Millions)");
}

function drawAxes(limits, x, y, svgContainer, msm) {
    // return x value from a row of data
    let xValue = function (d) {
        return +d[x];
    }

    // function to scale x value
    let xScale = d3.scaleLinear()
        .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
        .range([0 + msm.marginAll, msm.width - msm.marginAll])

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) {
        return xScale(xValue(d));
    };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
        .attr('transform', 'translate(0, ' + (msm.height - msm.marginAll) + ')')
        .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) {
        return +d[y]
    }

    // function to scale y
    let yScale = d3.scaleLinear()
        .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
        .range([0 + msm.marginAll, msm.height - msm.marginAll])

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) {
        return yScale(yValue(d));
    };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
        .attr('transform', 'translate(' + msm.marginAll + ', 0)')
        .call(yAxis);

    // return mapping and scaling functions
    return {
        x: xMap,
        y: yMap,
        xScale: xScale,
        yScale: yScale
    };
}

function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax
    }
}

function makeLabels(svgContainer, msm, title, x, y) {
    svgContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 90)
        .attr('y', msm.marginAll / 2 + 10)
        .style('font-size', '10pt')
        .text(title);

    svgContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 30)
        .attr('y', msm.height - 10)
        .style('font-size', '10pt')
        .text(x);

    svgContainer.append('text')
        .attr('transform', 'translate( 15,' + (msm.height / 2 + 30) + ') rotate(-90)')
        .style('font-size', '10pt')
        .text(y);
}

const mouseleave = (d, tooltip) => {
    state.tooltipDiv
        .transition()
        .style("opacity", 0)
}

// Launches our main function
initializePlot();