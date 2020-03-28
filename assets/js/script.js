let groups = {};
let current = "sex";
let currentDistribution = {};
let svg, x, y, xAxis, yAxis, tooltip;
let svgD, xD, yD, xAxisD, yAxisD, tooltipD;

// Get the dimensions and set margins
let margin = 30,
    marginD = 30,
    barWidth = document.getElementById("barSvg").clientWidth - 2 * margin,
    barHeight = document.getElementById("barSvg").clientHeight - 2 * margin,
    pieWidth = document.getElementById("pieSvg").clientWidth - 2 * marginD,
    pieHeight = document.getElementById("pieSvg").clientHeight - 2 * marginD;

initiate();

function initiate() {
    let c = "";
    d3.csv("assets/data/anxiety_personal_char.csv", (d) => {
        if (d.group) {
            c = d.group;
            groups[c] = [];
        } else {
            groups[c].push(d);
        }
    }).then(() => {
        createRadioButtons(Object.keys(groups));
        plot(groups[current]);
    });
    document.getElementById("pieSvg").style.display = "none";
    document.getElementById("toggleButtons").style.display = "none";

}

function plot(set) {
    // Select svg
    svg = d3.select("#barSvg")
        .append("g")
        .attr("transform",
            "translate(" + margin + "," + margin + ")");

    // X axis
    x = d3.scaleBand()
        .range([ 0, barWidth ])
        .padding(0.3);
    xAxis = svg.append("g")
        .attr("transform", "translate(0," + barHeight + ")");


    // Y axis
    y = d3.scaleLinear()
        .range([ barHeight, 0]);
    yAxis = svg.append("g");

    // Tooltip
    tooltip = d3.select("#chartCard")
        .append("div")
        .attr('class', 'tooltip')
        .style("visibility", "hidden");

    update(set, "sex");
}

function update(set, setName) {
    current = setName;
    // Update the X axis
    x.domain(set.map((d) => {return d.subgroup}));
    xAxis.call(d3.axisBottom(x));

    // Update the Y axis
    y.domain([0, d3.max(set, d => { return d.average }) ]);
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    // Draw bars
    let attachData = svg.selectAll("rect").data(set);
    attachData
        .join("rect")
        .on("click", d => expand(d))
        .on("mouseover", d => {showTooltip(d.subgroup, d.average); showDistribution(d)})
        .on("mousemove", () => mouseMove())
        .on("mouseout", () => mouseOut())
        .transition()
        .duration(3000)
        .attr("class", d => {
            if (d.subgroup === "inactive" || d.subgroup === "part time") {
                return "bar more"
            } else {
                return "bar"
            }
        })
        .attr("x", d => x(d.subgroup))
        .attr("y", d => y(d.average))
        .attr("width", x.bandwidth())
        .attr("height", d => barHeight - y(d.average))
        .attr("stroke", "#F25757")
        .attr("stroke-width", d => {
            if (d.subgroup === "inactive" || d.subgroup === "part time") {
                return "2px"
            } else return "0px"
        });

}

function expand(d) {
    let setName = "";
    let radios = document.getElementsByClassName("custom-radio");
    let input;
    console.log(radios);
    if (d.subgroup === "inactive"){
        setName = "reason for economic inactivity";
        input = radios[6];
    } else if (d.subgroup === "part time") {
        setName = "reasons for part-time work";
        input = radios[8];
    }
    input.getElementsByTagName("input")[0].checked = true;
    update(groups[setName], setName)
}

function showDistribution(d) {
    if (currentDistribution !== d) {
        d3.select("#barDSvg").selectAll("*").remove();
        d3.select("#pieSvg").selectAll("*").remove();
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
        document.getElementById("toggleButtons").style.display = "block";
        document.getElementById("titleDistribution").innerText = "Answer distribution: " + d.subgroup;
        plotPieDistribution(distribution);
        plotBarDistribution(distribution);
        currentDistribution = d;
    }

}
function plotPieDistribution(set) {
    const radius = Math.min(pieWidth, pieHeight) / 2 ;

    let svg = d3.select("#pieSvg")
        .append("g")
        .attr("transform", "translate(" + (pieWidth + 2*marginD) / 2 + "," + (pieHeight + 2*marginD) / 2 + ")");

    // Colour scale
    let color = d3.scaleOrdinal()
        .domain(set)
        .range(["#78CDD7", "#328189", "#2F5559", "#0C9FAF"]);

    // Calculate pie chart
    let pie = d3.pie().value(d => {return d.value; });
    let arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Draw piechart
    svg
        .selectAll('slices')
        .data(pie(set))
        .join('path')
        .attr('d', arc)
        .attr('fill', d => { return(color(d.data.name)) })
        .attr("stroke", "#fff")
        .style("stroke-width", "1px");

    // Labels
    svg
        .selectAll('slices')
        .data(pie(set))
        .join('text')
        .text(d => {return (d.data.name + " " + d.data.value + "%")})
        .attr("transform", d => { return "translate(" + arc.centroid(d) + ")";  })
        .style("text-anchor", "middle")
        .style("fill", "#f9f9f9");
}

function plotBarDistribution(set) {
    // Select svg
    svgD = d3.select("#barDSvg")
        .append("g")
        .attr("transform",
            "translate(" + (marginD + 20) + "," + marginD + ")");

    // X axis
    xD = d3.scaleBand()
        .range([ 0, pieWidth ])
        .padding(0.3);
    xAxisD = svgD.append("g")
        .attr("transform", "translate(0," + pieHeight + ")");

    // Y axis
    yD = d3.scaleLinear()
        .range([ pieHeight, 0]);
    yAxisD = svgD.append("g");

    // Tooltip
    tooltipD = d3.select("#distributionCard")
        .append("div")
        .attr('class', 'tooltip')
        .style("visibility", "hidden");

    // Update the X axis
    xD.domain(set.map((d) => {return d.name}));
    xAxisD.call(d3.axisBottom(xD));

    // Update the Y axis
    yD.domain([0, 100]);
    yAxisD.call(d3.axisLeft(yD).tickFormat(d => {return d +"%"}));

    let attachData = svgD.selectAll("rect").data(set);
    attachData
        .join("rect")
        .on("mouseover", d => showTooltip(d.name,(d.value + "%")))
        .on("mousemove", () => mouseMove())
        .on("mouseout", () => mouseOut())
        .attr("class", "bar")
        .attr("x", d => xD(d.name))
        .attr("y", d => yD(d.value))
        .attr("width", xD.bandwidth())
        .attr("height", d => pieHeight - yD(d.value));
}

function showTooltip(label, value) {
    tooltip.transition()
        .duration(200)
        .style("visibility", "visible");
    tooltip	.html('<b>' + label + '</b><br>' + value);
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

function createRadioButtons(list) {
    list.forEach((d, i) => {
        let parent = document.getElementById("options");
        let radio = document.createElement("div"),
            input = document.createElement("input"),
            label = document.createElement("label");

        label.onclick = e => {
            update(groups[e.target.textContent], e.target.textContent);
        };

        input.checked = (d === current);
        radio.className = "custom-control custom-radio";
        if (d.includes("reason")) {radio.className += " ml-4"}
        input.className = "custom-control-input";
        input.type = "radio";
        input.id = "radio" + i;
        input.setAttribute("name", "customRadio");
        label.className = "custom-control-label";
        label.setAttribute("for", "radio" + i);
        label.innerHTML = d;
        radio.appendChild(input);
        radio.appendChild(label);
        parent.appendChild(radio);

    });
}

function openTab(e, tabName) {
    let tabs = document.getElementsByClassName("tab");
    Array.prototype.forEach.call(tabs, function (d) {
        d.id === tabName ? d.style.display = "flex" : d.style.display = "none"
    });

    let navLinks = document.getElementsByClassName("navLink");
    Array.prototype.forEach.call(navLinks, function (d) {
        d.className = d.className.replace(" active", "");
    });

    e.currentTarget.className += " active";
}

function toggleDistribution(button) {
    let buttons = document.getElementsByClassName("buttonToggle");
    Array.from(buttons).forEach((b) => {
        b.disabled = false;
    });
    button.disabled = true;

    if (button.innerText === "Pie chart") {
        document.getElementById("barDSvg").style.display = "none";
        document.getElementById("pieSvg").style.display = "block";
    } else {
        document.getElementById("barDSvg").style.display = "block";
        document.getElementById("pieSvg").style.display = "none";
    }

}





