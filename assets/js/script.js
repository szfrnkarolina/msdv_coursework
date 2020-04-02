let groups = {};
let englishRegions = {};
let countries = {};
let uk = [];
let ukAverage = {};

let barChartA = {};
let barChartD = {};
let tooltip;
let svgDP, pie, arc, colorScale;

let current = "sex";
let currentDistribution = {};

let pieDrawn = false;
let barDrawn = false;

// Get the dimensions and set margins
let marginAx = 75,
    marginAy = 60,
    marginDx = 30,
    marginDy = 15,
    avgChartWidth = document.getElementById("barSvg").clientWidth - 2 * marginAx,
    avgChartHeight = document.getElementById("barSvg").clientHeight - 2 * marginAy,
    distChartWidth = document.getElementById("pieSvg").clientWidth - 2 * marginDx,
    distChartHeight = document.getElementById("pieSvg").clientHeight - 2 * marginDy;

initiate();

function initiate() {
    document.getElementById("characteristics").style.display = "none";
    document.getElementById("countries").style.display = "none";
    document.getElementById("pieSvg").style.display = "none";

    loadCharacteristicsData("assets/data/anxiety_personal_char.csv");
}

function loadCharacteristicsData(fileSrc) {
    let g = "";
    d3.csv(fileSrc, (d) => {
        if (d.group) {
            g = d.group;
            groups[g] = [];
        } else {
            if (d.subgroup === "United Kingdom") {
                ukAverage = d;
                showDistribution(d, "subgroup");
            } else {
                groups[g].push(d);
            }
        }
    }).then(() => {
        createRadioButtons(Object.keys(groups), "characteristics", groups);
        plotAverageBar(groups[current]);
        loadGeoData("assets/data/anxiety_counties.csv");
    });
}

function loadGeoData(fileSrc) {
    let c = "";
    let r = "";
    d3.csv(fileSrc, (d) => {
        let code = d["area codes"];
        if (code.length !== 0) {
            if (code.charAt(0) !== "K") {
                if (code.charAt(1) === "9") {
                    c = d["area names"];
                    countries[c] = [];
                    uk.push(d);
                } else if (code.charAt(0) === "E") {
                    if (code.substring(0, 8) === "E1200000") {
                        countries[c].push(d);
                        r = d["area names"];
                        englishRegions[r] = []
                    } else {
                        englishRegions[r].push(d);
                    }
                } else {
                    countries[c].push(d);
                }
            }
        }
    }).then(() => {
        let keys = Object.keys(countries);
        keys.unshift("United Kingdom");
        createRadioButtons(keys, "countries", countries);

        document.getElementById("toggleOptionsButtons").style.visibility = "visible";
        document.getElementById("characteristics").style.display = "block";

        // Hide loaders
        Array.prototype.forEach.call(document.getElementsByClassName("loader"), l => {
            l.style.display = "none";
        });
    });
}

function plotBar(svgID, width, height, marginLeft, marginTop) {
    // Select svg
    let svg = d3.select(svgID)
        .append("g")
        .attr("transform",
            "translate(" + marginLeft + "," + marginTop + ")");

    // X axis
    let x = d3.scaleBand()
        .range([0, width])
        .padding(0.3);
    let xAxis = svg.append("g")
        .attr("class", "xAxisBar")
        .attr("transform", "translate(0," + height + ")");

    // Y axis
    let y = d3.scaleLinear()
        .range([height, 0]);
    let yAxis = svg.append("g");

    if (svgID.includes("barD")) {
        barChartD = {x, xAxis, y, yAxis, svg};
    } else {
        barChartA = {x, xAxis, y, yAxis, svg};
    }
}

function plotAverageBar(set) {
    plotBar("#barSvg", avgChartWidth, avgChartHeight, (marginAx), (marginAy - 20));

    // Tooltip
    tooltip = d3.select("#chartCard")
        .append("div")
        .attr('class', 'tooltip')
        .style("visibility", "hidden");

    updateAverageChart(set, "sex", set === countries);
}

function updateAverageChart(set, setName, isGeo) {
    removeById("avgLine");
    removeById("avgLineLabel");

    current = setName;
    let xDomainCol = (isGeo) ? "area names" : "subgroup";
    let yDomainCol = "average";

    let x = barChartA.x,
        y = barChartA.y,
        xAxis = barChartA.xAxis,
        yAxis = barChartA.yAxis,
        svg = barChartA.svg;

    // Update the X axis
    x.domain(set.map((d) => {
        return d[xDomainCol]
    }));
    xAxis.call(d3.axisBottom(x))
        .selectAll("text")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-" + ((isGeo) ? 35 : 20) +")");

    // Update the Y axis
    y.domain([0, d3.max(set, d => {
        return d[yDomainCol]
    })]);
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    // Draw UK average line
    drawAverage(svg, y(ukAverage.average));

    // Draw bars
    let attachData = svg.selectAll("rect").data(set);
    attachData
        .join("rect")
        .on("click", d => {
            if (isGeo) {
                expandCountry(d)
            } else {
                expand(d)
            }})
        .on("mouseover", d => {
            showTooltip(d[xDomainCol], d[yDomainCol]);
            showDistribution(d, xDomainCol);
        })
        .on("mousemove", () => mouseMove())
        .on("mouseout", () => mouseOut())
        .transition()
        .duration(2000)
        .attr("class", d => {return (isExpandable(d, isGeo)) ? "bar more" : "bar"})
        .attr("x", d => x(d[xDomainCol]))
        .attr("y", d => y(d[yDomainCol]))
        .attr("width", x.bandwidth())
        .attr("height", d => avgChartHeight - y(d[yDomainCol]));

    // Move average line to top
    moveToTopById("avgLineLabel");
    moveToTopById("avgLine");
}

function drawAverage(svg, yCoordinate) {
    svg.append("line")
        .on("mouseover", () => {
            showDistribution(ukAverage, "subgroup");
        })
        .attr("id", "avgLine")
        .attr("class", "averageLine")
        .attr("x1", 0)
        .attr("y1", yCoordinate)
        .attr("x2", avgChartWidth)
        .attr("y2", yCoordinate);

    svg.append("text")
        .on("mouseover", () => {
            showDistribution(ukAverage, "subgroup");
        })
        .attr("id", "avgLineLabel")
        .attr("class", "averageLineLabel")
        .attr("x", (avgChartWidth + marginAx/2))
        .attr("y", yCoordinate)
        .text(ukAverage.average)
        .style("text-anchor", "end");
}

function isExpandable(d, isGeo) {
    if (isGeo) {
        return (d["area codes"].charAt(1) === "9" || d["area codes"].substring(0, 8) === "E1200000");
    } else {
        return (d.subgroup === "inactive" || d.subgroup === "part time")
    }
}

function expand(d) {
    let setName = "";
    let radios = document.getElementsByClassName("custom-radio");
    let input;
    if (d.subgroup === "inactive") {
        setName = "reason for economic inactivity";
        input = radios[6];
    } else if (d.subgroup === "part time") {
        setName = "reasons for part-time work";
        input = radios[8];
    }
    input.getElementsByTagName("input")[0].checked = true;
    updateAverageChart(groups[setName], setName, false)
}

function expandCountry(d) {
    let set;
    let setName = d["area names"];
    let code = d["area codes"];

    if (code.charAt(1) === "9") {
        let radios = document.getElementsByClassName("custom-radio");
        Array.prototype.forEach.call(radios, r => {
            r.getElementsByTagName("input")[0].checked = r.getElementsByTagName("label")[0].innerHTML === setName;
        });

        set = countries;
    } else if (code.substring(0, 8) === "E1200000") {
        set = englishRegions;
    } else {
        return;
    }
    document.getElementById("parentCat").innerText = setName;
    updateAverageChart(set[setName], setName, true);
}

function moveToTopById(id) {
    let toTop = document.getElementById(id);
    if (toTop) d3.select(toTop).raise();
}

function removeById(id) {
    let toRemove= document.getElementById(id);
    if (toRemove) toRemove.remove();
}

function showDistribution(d, domainColumn) {
    if (currentDistribution !== d) {
        let distribution = [];
        let keys = Object.keys(d);
        for (let k in keys) {
            if (keys[k] === "very low" || keys[k] === "low" || keys[k] === "medium" || keys[k] === "high") {
                distribution.push({
                    name: keys[k],
                    value: d[keys[k]]
                });
            }
        }

        let title ="Answer distribution: " + d[domainColumn];
        document.getElementById("toggleButtons").style.visibility = "visible";
        document.getElementById("titleDistribution").innerText = title;
        plotDistributionPie(distribution);
        plotDistributionBar(distribution);
        currentDistribution = d;
    }
}

function plotDistributionPie(set) {
    if(!pieDrawn) {
        const radius = Math.min(distChartWidth, distChartHeight) / 2;

        svgDP = d3.select("#pieSvg")
            .append("g")
            .attr("transform", "translate(" + (distChartWidth + 2* marginDx) / 2 + "," + (distChartHeight + 2 * marginDy) / 2 + ")");

        // Colour scale
        colorScale = d3.scaleOrdinal()
            .domain(set)
            .range(["#08415C", "#377896", "#055F89", "#68CFFF"]);

        // Calculate pie chart
        pie = d3.pie().value(d => {
            return d.value;
        }).sort(null);
        arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);
        pieDrawn = true;
    }

    updateDistributionPie(set);
}


function updateDistributionPie(set) {
    let chart = svgDP
        .selectAll("path")
        .data(pie(set));

    // Animate
    chart.transition().duration(800).attrTween("d", function(d) {
        let interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return (t) => arc(interpolate(t));
    });

    // Draw pie chart
    chart.enter().append("path")
        .attr("d", arc)
        .attr("fill", d => {return (colorScale(d.data.name))})
        .attr("stroke", "#fff")
        .style("stroke-width", "1px")
        .each(function(d) { this._current = d; });


    // Labels
    svgDP
        .selectAll("text")
        .data(pie(set))
        .join("text")
        .text(d => {return (d.data.name + " " + d.data.value + "%")})
        .attr("class", "pieLabels")
        .transition().duration(800)
        .attr("transform", d => {return "translate(" + arc.centroid(d) + ")";})
        .style("text-anchor", "middle")
        .style("fill", "#f9f9f9");

}

function plotDistributionBar(set) {
    if(!barDrawn) {
        plotBar("#barDSvg", distChartWidth, distChartHeight, (marginDx + 20), (marginDy));

        colorScale = d3.scaleOrdinal()
            .domain(set)
            .range(["#08415C", "#377896", "#055F89", "#68CFFF"]);

        barDrawn = true;
    }

    updateDistributionBar(set);
}

function updateDistributionBar(set) {
    let x = barChartD.x,
        y = barChartD.y,
        xAxis = barChartD.xAxis,
        yAxis = barChartD.yAxis,
        svg = barChartD.svg;

    // Update the X axis
    x.domain(set.map((d) => {return d.name}));
    xAxis.call(d3.axisBottom(x));

    // Update the Y axis
    y.domain([0, 100]);
    yAxis.call(d3.axisLeft(y).tickFormat(d => {return d + "%"}));

    // Update bard
    let attachData = svg.selectAll("rect").data(set);
    attachData
        .join("rect")
        .on("mouseover", d => showTooltip(d.name, (d.value + "%")))
        .on("mousemove", () => mouseMove())
        .on("mouseout", () => mouseOut())
        .transition().duration(200)
        .attr('fill', d => {return (colorScale(d.name))})
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => distChartHeight - y(d.value));
}

function showTooltip(label, value) {
    tooltip.transition()
        .duration(200)
        .style("visibility", "visible");
    tooltip.html('<b>' + label + '</b><br>' + value);
}

function mouseOut() {
    tooltip.transition()
        .duration(200)
        .style("visibility", "hidden");
}

function mouseMove() {
    tooltip
        .style("left", (event.pageX - 20) + "px")
        .style("top", (event.pageY - 100) + "px");
}

function createRadioButtons(list, parentId, set) {
    list.forEach((d, i) => {
        let radioId = set === countries ? "c" + i : i;
        let parent = document.getElementById(parentId);
        let radio = document.createElement("div"),
            input = document.createElement("input"),
            label = document.createElement("label");

        label.onclick = e => {
            changeCategory(e.target.textContent, set)
        };

        input.checked = (d === current);
        radio.className = "custom-control custom-radio";
        if (d.includes("reason") || set === countries && d !== "United Kingdom") {
            radio.className += " ml-4"
        }
        input.className = "custom-control-input";
        input.type = "radio";
        input.id = "radio" + radioId;
        input.setAttribute("name", "customRadio");
        label.className = "custom-control-label";
        label.setAttribute("for", "radio" + radioId);
        label.innerHTML = d;
        radio.appendChild(input);
        radio.appendChild(label);
        parent.appendChild(radio);
    });
}

function displayParent(parent) {
    let categoryName;
    if (parent.innerText === "United Kingdom" || Object.keys(countries).includes(parent.innerText)) {
        categoryName = "United Kingdom";
    } else {
        categoryName = "England";
    }
    changeCategory(categoryName);

    // Check radio button
    let radios = document.getElementsByClassName("custom-radio");
    Array.prototype.forEach.call(radios, r => {
        r.getElementsByTagName("input")[0].checked = r.getElementsByTagName("label")[0].innerHTML === categoryName;
    });
}

function changeCategory(category, setIn) {
    let set = setIn ? setIn : countries;
    let dataSet = [];
    if (set === countries) {
        if (category === "United Kingdom") {
            dataSet = uk;
        } else {
            dataSet = countries[category];
        }
        document.getElementById("parentCat").style.display = "inline-block";
        document.getElementById("parentCat").innerText = category;
    } else {
        document.getElementById("parentCat").style.display = "none";
        dataSet = set[category];
    }
    updateAverageChart(dataSet, category, set === countries);
}

function toggleOptions(button) {
    let className = (button.className.includes("dist")) ? "distToggle" : "optionToggle";
    let buttons = document.getElementsByClassName(className);

    Array.from(buttons).forEach((b) => {
        b.disabled = false;
    });
    button.disabled = true;

    if (className === "distToggle") {
        displayOptions(button,"Pie chart","barDSvg","pieSvg");
    } else {
        displayOptions(button,"Personal characteristics","countries", "characteristics");
    }
}

function displayOptions(button, innerText, id1, id2) {
    if (button.innerText === innerText) {
        document.getElementById(id1).style.display = "none";
        document.getElementById(id2).style.display = "block";
    } else {
        document.getElementById(id1).style.display = "block";
        document.getElementById(id2).style.display = "none";
    }
}

function openTab(e, tabName) {
    let tabs = document.getElementsByClassName("tab");
    Array.prototype.forEach.call(tabs, d => {
        d.id === tabName ? d.style.display = "block" : d.style.display = "none"
    });

    let navLinks = document.getElementsByClassName("navLink");
    Array.prototype.forEach.call(navLinks, d => {
        d.className = d.className.replace(" active", "");
    });

    e.currentTarget.className += " active";
}





