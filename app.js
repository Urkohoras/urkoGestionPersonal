// ==========================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

let tareas = [];
let peliculas = [];
let musica = [];

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
    if (!mesAnio || !diasCalendario) return;

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
    btnMesAnterior.addEventListener('click', () => { fechaActual.setMonth(fechaActual.getMonth() - 1); renderizarCalendario(); });
    btnMesSiguiente.addEventListener('click', () => { fechaActual.setMonth(fechaActual.getMonth() + 1); renderizarCalendario(); });
}

// ==========================================
// CONEXIÓN EN TIEMPO REAL CON FIREBASE
// ==========================================

onSnapshot(collection(db, "tareas"), (snapshot) => {
    tareas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    tareas.sort((a, b) => {
        if (!a.fecha) return 1; if (!b.fecha) return -1;
        return new Date(a.fecha) - new Date(b.fecha);
    });
    renderizarCalendario();
    if (document.getElementById('lista-tareas')) renderizarTareas();
});

onSnapshot(collection(db, "peliculas"), (snapshot) => {
    peliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    peliculas.sort((a, b) => parseInt(b.nota) - parseInt(a.nota));
    if (document.getElementById('lista-peliculas')) renderizarPeliculas();
});

onSnapshot(collection(db, "musica"), (snapshot) => {
    musica = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    musica.sort((a, b) => parseInt(b.nota) - parseInt(a.nota));
    if (document.getElementById('lista-musica')) renderizarMusica();
});

// ==========================================
// LÓGICA DE TAREAS (EDICIÓN INCLUIDA)
// ==========================================
const listaTareas = document.getElementById('lista-tareas');
const modalTarea = document.getElementById('modal-tarea');
const inputNombre = document.getElementById('nombre-tarea');
const inputTipo = document.getElementById('tipo-tarea');
const inputFecha = document.getElementById('fecha-tarea');
const inputRef = document.getElementById('ref-tarea');
let idEdicionTarea = null; // Variable para saber si estamos editando

function cerrarModalTarea() {
    modalTarea.classList.remove('mostrar-modal');
    inputNombre.value = ''; inputFecha.value = ''; inputRef.value = ''; inputTipo.value = 'Deberes';
    idEdicionTarea = null;
    document.querySelector('#modal-tarea h3').textContent = 'Nueva Tarea';
}

function renderizarTareas() {
    if (!listaTareas) return;
    listaTareas.innerHTML = '';
    
    tareas.forEach((tarea) => {
        const li = document.createElement('li');
        
        // EVENTO DE EDICIÓN: Al hacer clic en el LI
        li.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') return; // Evita abrir si pulsamos la 'X' de borrar
            idEdicionTarea = tarea.id;
            document.querySelector('#modal-tarea h3').textContent = 'Editar Tarea';
            inputNombre.value = tarea.nombre;
            inputTipo.value = tarea.tipo || 'Otro';
            inputFecha.value = tarea.fecha || '';
            inputRef.value = tarea.referencia || '';
            modalTarea.classList.add('mostrar-modal');
        });

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
        btnEliminar.onclick = async (e) => {
            e.stopPropagation(); // Evita que se abra el modal de editar
            await deleteDoc(doc(db, "tareas", tarea.id));
        };
        li.appendChild(btnEliminar);

        listaTareas.appendChild(li);
    });
}

if (document.getElementById('btn-abrir-formulario')) {
    document.getElementById('btn-abrir-formulario').addEventListener('click', () => modalTarea.classList.add('mostrar-modal'));
    document.getElementById('btn-cancelar-tarea').addEventListener('click', cerrarModalTarea);
    
    document.getElementById('btn-guardar-tarea').addEventListener('click', async () => {
        const nombre = inputNombre.value.trim();
        if (nombre !== '') {
            const datosTarea = { nombre: nombre, tipo: inputTipo.value, fecha: inputFecha.value, referencia: inputRef.value.trim() };
            try {
                if (idEdicionTarea) {
                    await updateDoc(doc(db, "tareas", idEdicionTarea), datosTarea);
                } else {
                    await addDoc(collection(db, "tareas"), datosTarea);
                }
                cerrarModalTarea();
            } catch (e) { console.error(e); alert("Error de conexión."); }
        } else { alert('¡El nombre no puede estar vacío!'); }
    });
}

// ==========================================
// LÓGICA DE PELÍCULAS (EDICIÓN INCLUIDA)
// ==========================================
const listaPeliculas = document.getElementById('lista-peliculas');
const modalPelicula = document.getElementById('modal-pelicula');
const inputTitulo = document.getElementById('titulo-pelicula');
const inputImagen = document.getElementById('imagen-pelicula');
const inputPlataforma = document.getElementById('plataforma-pelicula');
const inputFechaPelicula = document.getElementById('fecha-pelicula');
const inputNota = document.getElementById('nota-pelicula');
let idEdicionPelicula = null;

function cerrarModalPelicula() {
    modalPelicula.classList.remove('mostrar-modal');
    inputTitulo.value = ''; inputImagen.value = ''; inputFechaPelicula.value = ''; inputNota.value = '3'; inputPlataforma.value = 'Cine';
    idEdicionPelicula = null;
    document.querySelector('#modal-pelicula h3').textContent = 'Nueva Película';
}

function renderizarPeliculas() {
    if (!listaPeliculas) return;
    listaPeliculas.innerHTML = '';
    
    peliculas.forEach((pelicula) => {
        const li = document.createElement('li');
        li.style.padding = '12px 15px';
        
        li.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') return;
            idEdicionPelicula = pelicula.id;
            document.querySelector('#modal-pelicula h3').textContent = 'Editar Película';
            inputTitulo.value = pelicula.titulo;
            inputImagen.value = pelicula.imagen || '';
            inputPlataforma.value = pelicula.plataforma || 'Otro';
            inputFechaPelicula.value = pelicula.fecha || '';
            inputNota.value = pelicula.nota || '3';
            modalPelicula.classList.add('mostrar-modal');
        });
        
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
        btnEliminar.onclick = async (e) => {
            e.stopPropagation();
            await deleteDoc(doc(db, "peliculas", pelicula.id));
        };
        li.appendChild(btnEliminar);

        listaPeliculas.appendChild(li);
    });
}

if (document.getElementById('btn-abrir-form-pelicula')) {
    document.getElementById('btn-abrir-form-pelicula').addEventListener('click', () => modalPelicula.classList.add('mostrar-modal'));
    document.getElementById('btn-cancelar-pelicula').addEventListener('click', cerrarModalPelicula);
    
    document.getElementById('btn-guardar-pelicula').addEventListener('click', async () => {
        const titulo = inputTitulo.value.trim();
        if (titulo !== '') {
            const datosPeli = { titulo: titulo, imagen: inputImagen.value.trim(), plataforma: inputPlataforma.value, fecha: inputFechaPelicula.value, nota: inputNota.value };
            try {
                if (idEdicionPelicula) {
                    await updateDoc(doc(db, "peliculas", idEdicionPelicula), datosPeli);
                } else {
                    await addDoc(collection(db, "peliculas"), datosPeli);
                }
                cerrarModalPelicula();
            } catch (e) { console.error(e); alert("Error de conexión."); }
        } else { alert('¡El título no puede estar vacío!'); }
    });
}

// ==========================================
// LÓGICA DE MÚSICA
// ==========================================
const listaMusica = document.getElementById('lista-musica');
const modalMusica = document.getElementById('modal-musica');
const inputTituloMusica = document.getElementById('titulo-musica');
const inputArtistaMusica = document.getElementById('artista-musica');
const inputFechaMusica = document.getElementById('fecha-musica');
const inputNotaMusica = document.getElementById('nota-musica');
let idEdicionMusica = null;

function cerrarModalMusica() {
    modalMusica.classList.remove('mostrar-modal');
    inputTituloMusica.value = ''; inputArtistaMusica.value = ''; inputFechaMusica.value = ''; inputNotaMusica.value = '3';
    idEdicionMusica = null;
    document.querySelector('#modal-musica h3').textContent = 'Nuevo Proyecto';
}

function renderizarMusica() {
    if (!listaMusica) return;
    listaMusica.innerHTML = '';
    
    musica.forEach((item) => {
        const li = document.createElement('li');
        
        li.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') return;
            idEdicionMusica = item.id;
            document.querySelector('#modal-musica h3').textContent = 'Editar Proyecto';
            inputTituloMusica.value = item.titulo;
            inputArtistaMusica.value = item.artista || '';
            inputFechaMusica.value = item.fecha || '';
            inputNotaMusica.value = item.nota || '3';
            modalMusica.classList.add('mostrar-modal');
        });
        
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('item-musica');
        
        const titulo = document.createElement('span');
        titulo.classList.add('titulo-tarea');
        titulo.textContent = item.titulo;
        infoDiv.appendChild(titulo);

        const estrellas = document.createElement('span');
        estrellas.classList.add('estrellas-pelicula');
        estrellas.textContent = '⭐'.repeat(parseInt(item.nota));
        infoDiv.appendChild(estrellas);

        const detallesDiv = document.createElement('div');
        detallesDiv.classList.add('detalles-tarea');
        
        if (item.artista) {
            const spanArtista = document.createElement('span');
            spanArtista.classList.add('artista-badge');
            spanArtista.textContent = item.artista;
            detallesDiv.appendChild(spanArtista);
        }
        if (item.fecha) {
            const spanFecha = document.createElement('span');
            const fechaFormat = new Date(item.fecha).toLocaleDateString('es-ES');
            spanFecha.textContent = `📅 ${fechaFormat}`;
            detallesDiv.appendChild(spanFecha);
        }

        infoDiv.appendChild(detallesDiv);
        li.appendChild(infoDiv);
        
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '❌';
        btnEliminar.onclick = async (e) => {
            e.stopPropagation();
            await deleteDoc(doc(db, "musica", item.id));
        };
        li.appendChild(btnEliminar);

        listaMusica.appendChild(li);
    });
}

if (document.getElementById('btn-abrir-form-musica')) {
    document.getElementById('btn-abrir-form-musica').addEventListener('click', () => modalMusica.classList.add('mostrar-modal'));
    document.getElementById('btn-cancelar-musica').addEventListener('click', cerrarModalMusica);
    
    document.getElementById('btn-guardar-musica').addEventListener('click', async () => {
        const titulo = inputTituloMusica.value.trim();
        const artista = inputArtistaMusica.value.trim();
        if (titulo !== '' && artista !== '') {
            const datosMusica = { titulo: titulo, artista: artista, fecha: inputFechaMusica.value, nota: inputNotaMusica.value };
            try {
                if (idEdicionMusica) {
                    await updateDoc(doc(db, "musica", idEdicionMusica), datosMusica);
                } else {
                    await addDoc(collection(db, "musica"), datosMusica);
                }
                cerrarModalMusica();
            } catch (e) { console.error(e); alert("Error de conexión."); }
        } else { alert('¡El título y el artista son obligatorios!'); }
    });
}