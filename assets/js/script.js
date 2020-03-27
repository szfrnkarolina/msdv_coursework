
// Get the dimensions and set margins
let w = document.getElementById("chartSvg").clientWidth,
    h = document.getElementById("chartSvg").clientHeight,
    margin = 30,
    width = w - 2*margin,
    height = h - 2*margin;


function plot(set) {
    // Select svg
    let svg = d3.select("#chartSvg")
        .append("g")
        .attr("transform",
            "translate(" + margin + "," + margin + ")");

    // X axis
    let x = d3.scaleBand()
        .range([ 0, width ])
        .domain(set.map((d) => {return d.subgroup}))
        .padding(0.3);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Y axis
    let y = d3.scaleLinear()
        .domain([0, 11])
        .range([ height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    let attachData = svg.selectAll("rect").data(set);

    attachData
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.subgroup))
        .attr("y", d => y(d.average))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.average))
        .transition()
        .duration(3000);
}

let groups = {};
let current = "";
d3.csv("assets/data/anxiety_personal_char.csv", (d) => {
    if (d.group) {
        current = d.group;
        groups[current] = [];
    } else {
        groups[current].push(d);
    }}).then(() => {
        plot(groups.sex, "subgroup");
});


function openTab(evt, tabName) {
    let tabs = document.getElementsByClassName("tab");
    Array.prototype.forEach.call(tabs, function(d) {
        d.id === tabName ? d.style.display = "flex" : d.style.display = "none"
    });

    let navLinks = document.getElementsByClassName("navLink");
    Array.prototype.forEach.call(navLinks, function(d) {
        d.className = d.className.replace(" active", "");
    });

    evt.currentTarget.className += " active";
}


