import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let data = [];
let commits = [];

let xScale, yScale;

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
        });
  
        return ret;
      });
  }

function displayStats() {
    // Process commits first
    processCommits();
  
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Number of unique files in the codebase
    let uniqueFiles = new Set(data.map(d => d.file)).size;
    dl.append('dt').text('Files');
    dl.append('dd').text(uniqueFiles);

    let fileLineCounts = new Map();
    data.forEach(d => {
        fileLineCounts.set(d.file, (fileLineCounts.get(d.file) || 0) + 1);
    });

    // Average file length
    let avgFileLength = d3.mean([...fileLineCounts.values()]);
    dl.append('dt').text('Average file length');
    dl.append('dd').text(avgFileLength.toFixed(0));

  }
  

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));

    // processCommits();
    // console.log(commits);
    displayStats();
  }

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  createScatterplot();
  updateTooltipVisibility(false);
});

function createScatterplot() {
    const width = 1000;
    const height = 600;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
      };
      
      // Update scales with new ranges
      xScale.range([usableArea.left, usableArea.right]);
      yScale.range([usableArea.bottom, usableArea.top]);

      // Create the axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

        // Add X axis
        svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

        // Add Y axis
        svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);
    
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);
      
      // Create gridlines as an axis with no labels and full-width ticks
      gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
    const dots = svg.append('g').attr('class', 'dots');
    
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

          // Use sortedCommits in your selection instead of commits
    dots.selectAll('circle')

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt() // Change only this line
        .domain([minLines, maxLines])
        .range([2, 30]);

    dots
        .selectAll('circle')
        .data(sortedCommits).join('circle')
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        // .attr('r', 5)
        .attr('fill', 'steelblue')
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
          })
          .on('mouseleave', () => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            // updateTooltipContent({});
            updateTooltipVisibility(false);
          });
    
    brushSelector();
}

//   }
function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const linesEdited = document.getElementById('commit-lines-edited');
    
    if (Object.keys(commit).length === 0) {
        // Clear all tooltip content when no commit is passed
        link.href = '';
        link.textContent = '';
        date.textContent = '';
        time.textContent = '';
        author.textContent = '';
        linesEdited.textContent = '';
        return;
    }
  
    // Commit URL and ID
    link.href = commit.url;
    link.textContent = commit.id;
  
    // Commit date with full formatting (includes time)
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'short',
    //   timeStyle: 'long', // Show time with the date
    });
  
    // Commit time (formatted)
    time.textContent = commit.time ? commit.time : 'N/A';  // Display time if available, or 'N/A' if not
  
    // Commit author, default to 'Unknown' if no author info is available
    author.textContent = commit.author || 'Unknown';
  
    // Lines edited - assuming linesEdited exists on the commit object from processCommits
    linesEdited.textContent = commit.totalLines || 0;
  }
  
function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }
  
function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
function brushSelector() {
    const svg = d3.select('svg');

    // Create a brush and attach event listener
    const brush = d3.brush()
        .on('start brush end', brushed);

    // Apply brush to SVG
    svg.call(brush);

    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();
}

let brushSelection = null;

function brushed(event) {
  brushSelection = event.selection;
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) {
    if (!brushSelection) return false;
  
    // Brush selection bounds
    const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
    const max = { x: brushSelection[1][0], y: brushSelection[1][1] };
  
    // Transform commit data to pixel space using scales
    const x = xScale(commit.date);    // Date to pixel
    const y = yScale(commit.hourFrac);  // Hour fraction to pixel
  
    // Check if commit's x and y are inside the selection range
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
  }
  

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }

  function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  
    return breakdown;
  }