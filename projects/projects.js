import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
let selectedIndex = -1;

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
    // re-calculate rolled data
    let newRolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
    // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
    // re-calculate slice generator, arc data, arc, etc.
    let newArcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let colors = d3.scaleOrdinal(d3.schemeTableau10)
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => newArcGenerator(d))
    // TODO: clear up paths and legends
    d3.select('svg').selectAll('path').remove();
    d3.select('.legend').selectAll('li').remove();
    // update paths and legends, refer to steps 1.4 and 2.2
    newArcs.forEach((arc, idx) => {
        d3.select('svg')
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(idx))
        .on('click', () => {
            selectedIndex = selectedIndex === idx ? -1 : idx;
            
            let svg = d3.select('svg');
            svg.selectAll('path').attr('class', (_, idx) => (
                idx === selectedIndex ? 'selected' : ''
            ));
            let legend = d3.select('.legend');
            legend.selectAll('li').attr('class', (_, idx) => (
                idx === selectedIndex ? 'selected' : ''
            ));

            // applyFilters();
            if (selectedIndex === -1) {
                renderProjects(projects, projectsContainer, 'h2');
              } else {
                let selectedLabel = newData[selectedIndex].label
                let filteredProjects = projectsGiven.filter(p => p.year === selectedLabel)
                renderProjects(filteredProjects, projectsContainer, 'h2');
                // TODO: filter projects and project them onto webpage
                // Hint: `.label` might be useful
              }
        });
    })

    let legend = d3.select('.legend');
    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    })
  }
  
    // Call this function on page load
    renderPieChart(projects);
    renderProjects(projects, projectsContainer, 'h2');

    let query = '';
    let searchInput = document.querySelector('.searchBar');
    searchInput.addEventListener('change', (event) => {
        // update query value
        query = event.target.value;
        // applyFilters();
        // filter projects
        let filteredProjects = projects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        });   
        // re-render legends and pie chart when event triggers
        renderProjects(filteredProjects, projectsContainer, 'h2');
        renderPieChart(filteredProjects);
    });