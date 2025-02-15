console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [

  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'meta/', title: 'Meta' },
  { url: 'https://github.com/jetyue04', title: 'GitHub' }
  
    // { url: '/portfolio/', title: 'Home' },
    // { url: '/portfolio/projects/', title: 'Projects' },
    // { url: '/portfolio/contact/', title: 'Contact' },
    // { url: '/portfolio/resume/', title: 'Resume' },
    // { url: '/portfolio/meta/', title: 'Meta' },
    // { url: 'https://github.com/jetyue04', title: 'GitHub' }
  ];

let nav = document.createElement('nav');
document.body.prepend(nav); 

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    const ARE_WE_HOME = document.documentElement.classList.contains('home');

    if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '../' + url; 
    }

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
      }
    
      if (a.host !== location.host) {
        a.target = '_blank';
      }
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
            <option value="light dark">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>

          </select>
      </label>`
  );
const select =  document.querySelector('select');
if ('colorScheme' in localStorage) {
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    localStorage.colorScheme = event.target.value;
    document.documentElement.style.setProperty('color-scheme', event.target.value);
});

export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    console.log(response);

    const data = await response.json();
    console.log(data);
    return data; 

  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
      // Your code will go here
      containerElement.innerHTML = '';

      if (!containerElement) {
        console.error("Invalid container element");
        return;
    }

    const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validHeadings.includes(headingLevel)) {
        console.warn(`Invalid heading level "${headingLevel}". Falling back to "h2".`);
        headingLevel = 'h2'; // Set default heading level
    }

    const projectsTitleElement = document.querySelector('.projects-title');
    if (projectsTitleElement) {
        projectsTitleElement.innerText = `${project.length} Projects`;
    }

    if (project.length === 0) {
      const placeholder = document.createElement('p');
      placeholder.innerText = 'No projects available at the moment.';
      containerElement.appendChild(placeholder);
      return;
  }


      project.forEach(proj => {
        const article = document.createElement('article');
        article.innerHTML = `
          <${headingLevel}>${proj.title || 'Project Name'}</${headingLevel}>
          <img src="${proj.image || 'default-image.jpg'}" alt="${proj.title || 'Default Title'}">
          <div class="project-details">
                <p class="project-description">${proj.description || 'No description available'}</p>
                <p class="project-year">${proj.year || 'Year not available'}</p>
            </div>
        `;
        containerElement.appendChild(article);
      })
}

export async function fetchGitHubData(username) {
  // return statement here
  return fetchJSON(`https://api.github.com/users/${username}`);
}


// const data = await fetchJSON('../lib/projects.json');
// const container = document.querySelector('.projects');
// console.log(container);
// renderProjects(data, container, 'h2');