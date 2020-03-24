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