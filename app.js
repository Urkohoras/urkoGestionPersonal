// ==========================================
// SECCIÓN 1: MIS TAREAS
// ==========================================
const inputTarea = document.getElementById('nueva-tarea');
const btnAgregarTarea = document.getElementById('btn-agregar-tarea');
const listaTareas = document.getElementById('lista-tareas');

// Comprobamos si estamos en la página de Tareas
if (inputTarea && btnAgregarTarea && listaTareas) {
    let tareas = JSON.parse(localStorage.getItem('misTareas')) || [];

    function renderizarTareas() {
        listaTareas.innerHTML = '';
        tareas.forEach((tarea, index) => {
            const li = document.createElement('li');
            li.textContent = tarea;
            
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = '❌';
            btnEliminar.onclick = () => eliminarTarea(index);

            li.appendChild(btnEliminar);
            listaTareas.appendChild(li);
        });
    }

    function agregarTarea() {
        const textoTarea = inputTarea.value.trim();
        if (textoTarea !== '') {
            tareas.unshift(textoTarea); // Usamos unshift para que salgan arriba
            localStorage.setItem('misTareas', JSON.stringify(tareas));
            renderizarTareas();
            inputTarea.value = '';
        }
    }

    function eliminarTarea(indice) {
        tareas.splice(indice, 1);
        localStorage.setItem('misTareas', JSON.stringify(tareas));
        renderizarTareas();
    }

    btnAgregarTarea.addEventListener('click', agregarTarea);
    inputTarea.addEventListener('keypress', (evento) => {
        if (evento.key === 'Enter') agregarTarea();
    });

    renderizarTareas();
}

// ==========================================
// SECCIÓN 2: PELÍCULAS VISTAS
// ==========================================
const inputPelicula = document.getElementById('nueva-pelicula');
const btnAgregarPelicula = document.getElementById('btn-agregar-pelicula');
const listaPeliculas = document.getElementById('lista-peliculas');

// Comprobamos si estamos en la página de Películas
if (inputPelicula && btnAgregarPelicula && listaPeliculas) {
    let peliculas = JSON.parse(localStorage.getItem('misPeliculas')) || [];

    function renderizarPeliculas() {
        listaPeliculas.innerHTML = '';
        peliculas.forEach((pelicula, index) => {
            const li = document.createElement('li');
            li.textContent = pelicula;
            
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = '❌';
            btnEliminar.onclick = () => eliminarPelicula(index);

            li.appendChild(btnEliminar);
            listaPeliculas.appendChild(li);
        });
    }

    function agregarPelicula() {
        const textoPelicula = inputPelicula.value.trim();
        if (textoPelicula !== '') {
            peliculas.unshift(textoPelicula); // Usamos unshift para que salgan arriba
            localStorage.setItem('misPeliculas', JSON.stringify(peliculas));
            renderizarPeliculas();
            inputPelicula.value = '';
        }
    }

    function eliminarPelicula(indice) {
        peliculas.splice(indice, 1);
        localStorage.setItem('misPeliculas', JSON.stringify(peliculas));
        renderizarPeliculas();
    }

    btnAgregarPelicula.addEventListener('click', agregarPelicula);
    inputPelicula.addEventListener('keypress', (evento) => {
        if (evento.key === 'Enter') agregarPelicula();
    });

    renderizarPeliculas();
}