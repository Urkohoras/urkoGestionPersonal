// ==========================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCD1HXfRR7nIzF1jXo9Fsmbr7Rq2VcXPY",
  authDomain: "gestionpersonal-dbcc0.firebaseapp.com",
  projectId: "gestionpersonal-dbcc0",
  storageBucket: "gestionpersonal-dbcc0.firebasestorage.app",
  messagingSenderId: "784921494564",
  appId: "1:784921494564:web:33f257e0b4a0b48561c4b1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables globales para almacenar nuestros datos de la nube
let tareas = [];
let peliculas = [];

// ==========================================
// MENÚ DESPLEGABLE GLOBAL
// ==========================================
const btnMenu = document.getElementById('btn-menu');
const contenidoMenu = document.getElementById('contenido-menu');

if (btnMenu && contenidoMenu) {
    btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        contenidoMenu.classList.toggle('mostrar');
    });
    document.addEventListener('click', (evento) => {
        if (!contenidoMenu.contains(evento.target) && evento.target !== btnMenu) {
            contenidoMenu.classList.remove('mostrar');
        }
    });
}

// ==========================================
// LÓGICA DEL CALENDARIO (index.html)
// ==========================================
const mesAnio = document.getElementById('mes-anio');
const diasCalendario = document.getElementById('dias-calendario');
const btnMesAnterior = document.getElementById('mes-anterior');
const btnMesSiguiente = document.getElementById('mes-siguiente');
let fechaActual = new Date();

function renderizarCalendario() {
    if (!mesAnio || !diasCalendario) return; // Evita errores si no estamos en el index

    diasCalendario.innerHTML = '';
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    mesAnio.textContent = `${meses[mes]} ${año}`;
    
    let primerDia = new Date(año, mes, 1).getDay();
    primerDia = primerDia === 0 ? 6 : primerDia - 1;
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    const fechaHoy = new Date();
    
    for (let i = 0; i < primerDia; i++) {
        const divVacio = document.createElement('div');
        divVacio.classList.add('dia', 'vacio');
        diasCalendario.appendChild(divVacio);
    }
    
    for (let i = 1; i <= diasEnMes; i++) {
        const divDia = document.createElement('div');
        divDia.classList.add('dia');
        
        const spanNumero = document.createElement('span');
        spanNumero.textContent = i;
        divDia.appendChild(spanNumero);
        
        if (i === fechaHoy.getDate() && mes === fechaHoy.getMonth() && año === fechaHoy.getFullYear()) {
            divDia.classList.add('hoy');
        }

        const mesStr = String(mes + 1).padStart(2, '0');
        const diaStr = String(i).padStart(2, '0');
        const fechaBucle = `${año}-${mesStr}-${diaStr}`;

        // Filtramos las tareas que coincidan con este día
        const tareasDelDia = tareas.filter(t => t.fecha === fechaBucle);
        
        if (tareasDelDia.length > 0) {
            const divTareas = document.createElement('div');
            divTareas.classList.add('calendario-tareas');
            
            tareasDelDia.forEach(tarea => {
                const dot = document.createElement('div');
                dot.classList.add('calendario-tarea-dot');
                const tipoClase = tarea.tipo ? tarea.tipo.toLowerCase() : 'otro';
                dot.classList.add(`dot-${tipoClase}`);
                dot.textContent = tarea.nombre;
                divTareas.appendChild(dot);
            });
            divDia.appendChild(divTareas);
        }
        diasCalendario.appendChild(divDia);
    }
}

if (btnMesAnterior && btnMesSiguiente) {
    btnMesAnterior.addEventListener('click', () => {
        fechaActual.setMonth(fechaActual.getMonth() - 1);
        renderizarCalendario();
    });
    btnMesSiguiente.addEventListener('click', () => {
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        renderizarCalendario();
    });
}

// ==========================================
// CONEXIÓN EN TIEMPO REAL CON FIREBASE
// ==========================================

// 1. Escuchar Tareas
onSnapshot(collection(db, "tareas"), (snapshot) => {
    // Convertimos los documentos de Firebase en un array para nuestro JS
    tareas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Ordenamos las tareas por fecha
    tareas.sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(a.fecha) - new Date(b.fecha);
    });
    
    // Actualizamos la pantalla si estamos en la página correspondiente
    renderizarCalendario();
    if (document.getElementById('lista-tareas')) renderizarTareas();
});

// 2. Escuchar Películas
onSnapshot(collection(db, "peliculas"), (snapshot) => {
    peliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Ordenamos las películas por nota (de mayor a menor)
    peliculas.sort((a, b) => parseInt(b.nota) - parseInt(a.nota));
    
    if (document.getElementById('lista-peliculas')) renderizarPeliculas();
});


// ==========================================
// LÓGICA DE TAREAS (tareas.html)
// ==========================================
const listaTareas = document.getElementById('lista-tareas');
const modalTarea = document.getElementById('modal-tarea');
const inputNombre = document.getElementById('nombre-tarea');
const inputTipo = document.getElementById('tipo-tarea');
const inputFecha = document.getElementById('fecha-tarea');
const inputRef = document.getElementById('ref-tarea');

function renderizarTareas() {
    if (!listaTareas) return;
    listaTareas.innerHTML = '';
    
    tareas.forEach((tarea) => {
        const li = document.createElement('li');
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('info-tarea');
        
        const titulo = document.createElement('span');
        titulo.classList.add('titulo-tarea');
        titulo.textContent = tarea.nombre;
        infoDiv.appendChild(titulo);

        const detallesDiv = document.createElement('div');
        detallesDiv.classList.add('detalles-tarea');

        if (tarea.tipo) {
            const spanTipo = document.createElement('span');
            spanTipo.classList.add('etiqueta-tipo', `tipo-${tarea.tipo.toLowerCase()}`);
            spanTipo.textContent = tarea.tipo;
            detallesDiv.appendChild(spanTipo);
        }

        if (tarea.fecha) {
            const spanFecha = document.createElement('span');
            const fechaFormat = new Date(tarea.fecha).toLocaleDateString('es-ES');
            spanFecha.textContent = `📅 ${fechaFormat}`;
            detallesDiv.appendChild(spanFecha);
        }

        if (tarea.referencia) {
            const spanRef = document.createElement('span');
            spanRef.textContent = `🏷️ ${tarea.referencia}`;
            detallesDiv.appendChild(spanRef);
        }

        infoDiv.appendChild(detallesDiv);
        li.appendChild(infoDiv);
        
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '❌';
        // Ahora eliminamos usando el ID único de Firebase
        btnEliminar.onclick = async () => {
            await deleteDoc(doc(db, "tareas", tarea.id));
        };
        li.appendChild(btnEliminar);

        listaTareas.appendChild(li);
    });
}

if (document.getElementById('btn-abrir-formulario')) {
    document.getElementById('btn-abrir-formulario').addEventListener('click', () => modalTarea.classList.add('mostrar-modal'));
    document.getElementById('btn-cancelar-tarea').addEventListener('click', () => modalTarea.classList.remove('mostrar-modal'));
    
    document.getElementById('btn-guardar-tarea').addEventListener('click', async () => {
        const nombre = inputNombre.value.trim();
        if (nombre !== '') {
            const nuevaTarea = {
                nombre: nombre,
                tipo: inputTipo.value,
                fecha: inputFecha.value,
                referencia: inputRef.value.trim()
            };
            // Guardamos directamente en la nube
            await addDoc(collection(db, "tareas"), nuevaTarea);
            modalTarea.classList.remove('mostrar-modal');
            inputNombre.value = ''; inputFecha.value = ''; inputRef.value = '';
        } else {
            alert('¡El nombre de la tarea no puede estar vacío!');
        }
    });
}


// ==========================================
// LÓGICA DE PELÍCULAS (peliculas.html)
// ==========================================
const listaPeliculas = document.getElementById('lista-peliculas');
const modalPelicula = document.getElementById('modal-pelicula');
const inputTitulo = document.getElementById('titulo-pelicula');
const inputImagen = document.getElementById('imagen-pelicula');
const inputPlataforma = document.getElementById('plataforma-pelicula');
const inputFechaPelicula = document.getElementById('fecha-pelicula');
const inputNota = document.getElementById('nota-pelicula');

function renderizarPeliculas() {
    if (!listaPeliculas) return;
    listaPeliculas.innerHTML = '';
    
    peliculas.forEach((pelicula) => {
        const li = document.createElement('li');
        li.style.padding = '12px 15px';
        
        const contenedorPrincipal = document.createElement('div');
        contenedorPrincipal.classList.add('item-pelicula');
        
        const img = document.createElement('img');
        img.classList.add('portada-pelicula');
        img.src = pelicula.imagen ? pelicula.imagen : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="65" height="95" style="background:%232c323d"></svg>';
        contenedorPrincipal.appendChild(img);

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('info-pelicula');
        
        const titulo = document.createElement('span');
        titulo.classList.add('titulo-tarea');
        titulo.textContent = pelicula.titulo;
        infoDiv.appendChild(titulo);

        const estrellas = document.createElement('span');
        estrellas.classList.add('estrellas-pelicula');
        estrellas.textContent = '⭐'.repeat(parseInt(pelicula.nota));
        infoDiv.appendChild(estrellas);

        const detallesDiv = document.createElement('div');
        detallesDiv.classList.add('detalles-tarea');

        if (pelicula.plataforma) {
            const spanPlataforma = document.createElement('span');
            spanPlataforma.classList.add('plataforma-badge');
            spanPlataforma.textContent = pelicula.plataforma;
            detallesDiv.appendChild(spanPlataforma);
        }

        if (pelicula.fecha) {
            const spanFecha = document.createElement('span');
            const fechaFormat = new Date(pelicula.fecha).toLocaleDateString('es-ES');
            spanFecha.textContent = `📅 ${fechaFormat}`;
            detallesDiv.appendChild(spanFecha);
        }

        infoDiv.appendChild(detallesDiv);
        contenedorPrincipal.appendChild(infoDiv);
        li.appendChild(contenedorPrincipal);
        
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '❌';
        btnEliminar.onclick = async () => {
            await deleteDoc(doc(db, "peliculas", pelicula.id));
        };
        li.appendChild(btnEliminar);

        listaPeliculas.appendChild(li);
    });
}

if (document.getElementById('btn-abrir-form-pelicula')) {
    document.getElementById('btn-abrir-form-pelicula').addEventListener('click', () => modalPelicula.classList.add('mostrar-modal'));
    document.getElementById('btn-cancelar-pelicula').addEventListener('click', () => modalPelicula.classList.remove('mostrar-modal'));
    
    document.getElementById('btn-guardar-pelicula').addEventListener('click', async () => {
        const titulo = inputTitulo.value.trim();
        if (titulo !== '') {
            const nuevaPelicula = {
                titulo: titulo,
                imagen: inputImagen.value.trim(),
                plataforma: inputPlataforma.value,
                fecha: inputFechaPelicula.value,
                nota: inputNota.value
            };
            await addDoc(collection(db, "peliculas"), nuevaPelicula);
            modalPelicula.classList.remove('mostrar-modal');
            inputTitulo.value = ''; inputImagen.value = ''; inputFechaPelicula.value = ''; inputNota.value = '3';
        } else {
            alert('¡El título de la película no puede estar vacío!');
        }
    });
}