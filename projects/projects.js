import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
// console.log(container);
renderProjects(projects, projectsContainer, 'h2');