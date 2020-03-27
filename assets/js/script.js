let groups = {};

let current = "sex";

// Get the dimensions and set margins
let w = document.getElementById("chartSvg").clientWidth,
    h = document.getElementById("chartSvg").clientHeight,
    margin = 30,
    width = w - 2 * margin,
    height = h - 2 * margin;



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
}

initiate();

let svg, x, y, xAxis, yAxis;

function plot(set) {
    // Select svg
    svg = d3.select("#chartSvg")
        .append("g")
        .attr("transform",
            "translate(" + margin + "," + margin + ")");

    // X axis
    x = d3.scaleBand()
        .range([ 0, width ])
        .padding(0.3);
    xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")");


    // Y axis
    y = d3.scaleLinear()
        .range([ height, 0]);
    yAxis = svg.append("g");

    update(set)
}

function update(set) {
    // Update the X axis
    x.domain(set.map((d) => {return d.subgroup}));
    xAxis.call(d3.axisBottom(x));

    // Update the Y axis
    y.domain([0, d3.max(set, d => { return d.average }) ]);
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    let attachData = svg.selectAll("rect").data(set);

    attachData
        .join("rect")
        .transition()
        .duration(3000)
        .attr("class", "bar")
        .attr("x", d => x(d.subgroup))
        .attr("y", d => y(d.average))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.average));

}

function createRadioButtons(list) {
    console.log(list);
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






