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

// Variables globales actualizadas en tiempo real
let tareas = [];
let peliculas = [];
let musica = [];

// ==========================================
// MENÚ DESPLEGABLE GLOBAL
// ==========================================
const btnMenu = document.getElementById('btn-menu');
const contenidoMenu = document.getElementById('contenido-menu');

if (btnMenu && contenidoMenu) {
    btnMenu.addEventListener('click', (e) => { e.stopPropagation(); contenidoMenu.classList.toggle('mostrar'); });
    document.addEventListener('click', (evento) => { if (!contenidoMenu.contains(evento.target) && evento.target !== btnMenu) { contenidoMenu.classList.remove('mostrar'); } });
}

// ==========================================
// LÓGICA DEL CALENDARIO Y DETALLE DEL DÍA
// ==========================================
const mesAnio = document.getElementById('mes-anio');
const diasCalendario = document.getElementById('dias-calendario');
const btnMesAnterior = document.getElementById('mes-anterior');
const btnMesSiguiente = document.getElementById('mes-siguiente');
let fechaActual = new Date();

// Variables para el modal de Detalle del Día
const modalDetalleDia = document.getElementById('modal-detalle-dia');
const tituloDetalleDia = document.getElementById('titulo-detalle-dia');
const listaTareasDia = document.getElementById('lista-tareas-dia');
const listaOrganizacionDia = document.getElementById('lista-organizacion-dia');
const inputHoraInicio = document.getElementById('hora-inicio-actividad');
const inputHoraFin = document.getElementById('hora-fin-actividad');
const inputTituloActividad = document.getElementById('titulo-actividad');
const btnAddActividad = document.getElementById('btn-add-actividad');

let fechaSeleccionadaStr = null; // Guardará la fecha clickeada (AAAA-MM-DD)
let unsuscribeOrganizacion = null; // Para limpiar el escuchador de subcolección

// Función para renderizar el calendario (con clics activados)
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
        
        // --- NUEVO: GESTIÓN DEL CLIC EN EL DÍA ---
        const mesStr = String(mes + 1).padStart(2, '0');
        const diaStr = String(i).padStart(2, '0');
        const fechaBucle = `${año}-${mesStr}-${diaStr}`;

        divDia.onclick = () => abrirDetalleDia(fechaBucle, i, meses[mes]);
        // ----------------------------------------

        const spanNumero = document.createElement('span');
        spanNumero.textContent = i;
        divDia.appendChild(spanNumero);
        
        if (i === fechaHoy.getDate() && mes === fechaHoy.getMonth() && año === fechaHoy.getFullYear()) {
            divDia.classList.add('hoy');
        }

        const tareasDelDia = tareas.filter(t => t.fecha === fechaBucle);
        if (tareasDelDia.length > 0) {
            const divTareas = document.createElement('div');
            divTareas.classList.add('calendario-tareas');
            tareasDelDia.forEach(tarea => {
                const dot = document.createElement('div');
                dot.classList.add('calendario-tarea-dot', `dot-${tarea.tipo.toLowerCase()}`);
                dot.textContent = tarea.nombre;
                divTareas.appendChild(dot);
            });
            divDia.appendChild(divTareas);
        }
        diasCalendario.appendChild(divDia);
    }
}

// Función para abrir el modal gigante de detalle del día
function abrirDetalleDia(fechaString, numeroDia, nombreMes) {
    if (!modalDetalleDia) return;
    fechaSeleccionadaStr = fechaString; // Guardamos la fecha actual en la variable global
    
    // Título formateado
    tituloDetalleDia.textContent = `Día Detallado:`;
    
    // 1. Cargar y filtrar tareas
    listaTareasDia.innerHTML = '';
    const tareasDelDia = tareas.filter(t => t.fecha === fechaString);
    if (tareasDelDia.length > 0) {
        tareasDelDia.forEach(tarea => {
            const li = document.createElement('li');
            li.style.cursor = 'default';
            li.style.margin = '5px 0';
            li.style.padding = '8px 12px';
            li.innerHTML = `<span class="titulo-tarea" style="font-size: 0.9rem;">${tarea.nombre}</span> <span class="etiqueta-tipo tipo-${tarea.tipo.toLowerCase()}">${tarea.tipo}</span>`;
            listaTareasDia.appendChild(li);
        });
    } else {
        listaTareasDia.innerHTML = '<p style="color: #64748b; font-size: 0.9rem; text-align: center;">No hay tareas para hoy.</p>';
    }
    
    // 2. Cargar Organización Diaria (Escuchador en tiempo real de subcolección)
    if (unsuscribeOrganizacion) unsuscribeOrganizacion(); // Limpiamos escuchadores antiguos

    // Estructura: organizacionesDiarias -> [AAAA-MM-DD] -> actividades -> [documentos]
    const actividadesRef = collection(db, "organizacionesDiarias", fechaSeleccionadaStr, "actividades");
    
    unsuscribeOrganizacion = onSnapshot(actividadesRef, (snapshot) => {
        let actividadesArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Ordenamos por hora de inicio
        actividadesArr.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        renderizarActividadesDia(actividadesArr);
    });

    modalDetalleDia.classList.add('mostrar-modal');
}

// Función para renderizar la lista de actividades organizadas (con checkboxes)
function renderizarActividadesDia(actividades) {
    listaOrganizacionDia.innerHTML = '';
    if (actividades.length === 0) {
        listaOrganizacionDia.innerHTML = '<p style="color: #64748b; font-size: 0.9rem; text-align: center; margin-top: 15px;">Aún no has organizado este día. ¡Empieza abajo!</p>';
        return;
    }

    actividades.forEach((actividad, index) => {
        const li = document.createElement('li');
        li.classList.add('organizacion-item');
        li.style.cursor = 'default'; li.style.padding = '0'; li.style.background = 'none';
        
        if(actividad.completada) li.classList.add('completada');
        if(index === actividades.length - 1) li.classList.add('ultimo');

        // Checkbox para tachar
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('organizacion-checkbox');
        checkbox.checked = actividad.completada;
        checkbox.onchange = async () => {
            const actRef = doc(db, "organizacionesDiarias", fechaSeleccionadaStr, "actividades", actividad.id);
            await updateDoc(actRef, { completada: checkbox.checked });
        };
        li.appendChild(checkbox);

        // Información de la actividad (Horas y título)
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('organizacion-info');
        infoDiv.innerHTML = `
            <span class="organizacion-horas">${actividad.horaInicio} - ${actividad.horaFin}</span>
            <span class="organizacion-titulo">${actividad.titulo}</span>
        `;
        li.appendChild(infoDiv);

        // --- NUEVO: BOTÓN DE ELIMINAR ACTIVIDAD ---
        const btnEliminarActividad = document.createElement('button');
        btnEliminarActividad.textContent = '❌';
        btnEliminarActividad.classList.add('boton-cerrar-simple'); // Reutilizamos estilo
        btnEliminarActividad.style.marginLeft = 'auto'; // Lo empujamos a la derecha
        btnEliminarActividad.style.fontSize = '0.9rem';
        
        btnEliminarActividad.onclick = async (e) => {
            e.stopPropagation(); // Evita que se abra el modal de editar
            const actRef = doc(db, "organizacionesDiarias", fechaSeleccionadaStr, "actividades", actividad.id);
            await deleteDoc(actRef); // Borramos el documento de la subcolección
        };
        li.appendChild(btnEliminarActividad);
        // ----------------------------------------

        listaOrganizacionDia.appendChild(li);
    });
}

// Guardar nueva actividad en la organización diaria
if (btnAddActividad) {
    btnAddActividad.addEventListener('click', async () => {
        const titulo = inputTituloActividad.value.trim();
        const inicio = inputHoraInicio.value;
        const fin = inputHoraFin.value;

        if (titulo && inicio && fin && fechaSeleccionadaStr) {
            const nuevaActividad = { titulo: titulo, horaInicio: inicio, horaFin: fin, completada: false };
            try {
                // Guardamos en la subcolección correspondiente a la fecha
                const actividadesRef = collection(db, "organizacionesDiarias", fechaSeleccionadaStr, "actividades");
                await addDoc(actividadesRef, nuevaActividad);
                // Limpiar campos
                inputTituloActividad.value = ''; inputHoraInicio.value = ''; inputHoraFin.value = '';
            } catch (e) { console.error(e); alert("Error al guardar actividad."); }
        } else { alert('¡Título, inicio y fin son obligatorios!'); }
    });
}

// Botones de mes anterior/siguiente y cerrar detalle
if (btnMesAnterior && btnMesSiguiente) {
    btnMesAnterior.addEventListener('click', () => { fechaActual.setMonth(fechaActual.getMonth() - 1); renderizarCalendario(); });
    btnMesSiguiente.addEventListener('click', () => { fechaActual.setMonth(fechaActual.getMonth() + 1); renderizarCalendario(); });
    document.getElementById('btn-cerrar-detalle-dia').addEventListener('click', () => {
        modalDetalleDia.classList.remove('mostrar-modal');
        if (unsuscribeOrganizacion) unsuscribeOrganizacion(); // Parar escuchador al cerrar
    });
}

// ==========================================
// CONEXIÓN EN TIEMPO REAL CON FIREBASE
// ==========================================
onSnapshot(collection(db, "tareas"), (snapshot) => {
    tareas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    tareas.sort((a, b) => { if (!a.fecha) return 1; if (!b.fecha) return -1; return new Date(a.fecha) - new Date(b.fecha); });
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
let idEdicionTarea = null;

function cerrarModalTarea() { modalTarea.classList.remove('mostrar-modal'); inputNombre.value = ''; inputFecha.value = ''; inputRef.value = ''; inputTipo.value = 'Deberes'; idEdicionTarea = null; document.querySelector('#modal-tarea h3').textContent = 'Nueva Tarea'; }

function renderizarTareas() {
    if (!listaTareas) return; listaTareas.innerHTML = '';
    tareas.forEach((tarea) => {
        const li = document.createElement('li');
        li.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') return;
            idEdicionTarea = tarea.id;
            document.querySelector('#modal-tarea h3').textContent = 'Editar Tarea';
            inputNombre.value = tarea.nombre; inputTipo.value = tarea.tipo || 'Otro'; inputFecha.value = tarea.fecha || ''; inputRef.value = tarea.referencia || '';
            modalTarea.classList.add('mostrar-modal');
        });
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('info-tarea');
        infoDiv.innerHTML = `<span class="titulo-tarea">${tarea.nombre}</span>`;
        const detallesDiv = document.createElement('div');
        detallesDiv.classList.add('detalles-tarea');
        if (tarea.tipo) detallesDiv.innerHTML += `<span class="etiqueta-tipo tipo-${tarea.tipo.toLowerCase()}">${tarea.tipo}</span>`;
        if (tarea.fecha) detallesDiv.innerHTML += `<span>📅 ${new Date(tarea.fecha).toLocaleDateString('es-ES')}</span>`;
        if (tarea.referencia) detallesDiv.innerHTML += `<span>🏷️ ${tarea.referencia}</span>`;
        infoDiv.appendChild(detallesDiv);
        li.appendChild(infoDiv);
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '❌';
        btnEliminar.onclick = async (e) => { e.stopPropagation(); await deleteDoc(doc(db, "tareas", tarea.id)); };
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
                if (idEdicionTarea) { await updateDoc(doc(db, "tareas", idEdicionTarea), datosTarea); } 
                else { await addDoc(collection(db, "tareas"), datosTarea); }
                cerrarModalTarea();
            } catch (e) { console.error(e); }
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

function cerrarModalPelicula() { modalPelicula.classList.remove('mostrar-modal'); inputTitulo.value = ''; inputImagen.value = ''; inputFechaPelicula.value = ''; inputNota.value = '3'; inputPlataforma.value = 'Cine'; idEdicionPelicula = null; document.querySelector('#modal-pelicula h3').textContent = 'Nueva Película'; }

function renderizarPeliculas() {
    if (!listaPeliculas) return; listaPeliculas.innerHTML = '';
    peliculas.forEach((pelicula) => {
        const li = document.createElement('li');
        li.style.padding = '12px 15px';
        li.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') return;
            idEdicionPelicula = pelicula.id;
            document.querySelector('#modal-pelicula h3').textContent = 'Editar Película';
            inputTitulo.value = pelicula.titulo; inputImagen.value = pelicula.imagen || ''; inputPlataforma.value = pelicula.plataforma || 'Otro'; inputFechaPelicula.value = pelicula.fecha || ''; inputNota.value = pelicula.nota || '3';
            modalPelicula.classList.add('mostrar-modal');
        });
        const contenedorPrincipal = document.createElement('div');
        contenedorPrincipal.classList.add('item-entretenimiento');
        const img = document.createElement('img');
        img.classList.add('portada-portada');
        img.src = pelicula.imagen ? pelicula.imagen : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="65" height="95" style="background:%232c323d"></svg>';
        contenedorPrincipal.appendChild(img);
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('info-entretenimiento');
        infoDiv.innerHTML = `<span class="titulo-tarea">${pelicula.titulo}</span><span class="estrellas-valoracion">${'⭐'.repeat(parseInt(pelicula.nota))}</span>`;
        const detallesDiv = document.createElement('div');
        detallesDiv.classList.add('detalles-tarea');
        if (pelicula.plataforma) detallesDiv.innerHTML += `<span class="platforma-musica-badge">${pelicula.plataforma}</span>`;
        if (pelicula.fecha) detallesDiv.innerHTML += `<span>📅 ${new Date(pelicula.fecha).toLocaleDateString('es-ES')}</span>`;
        infoDiv.appendChild(detallesDiv);
        contenedorPrincipal.appendChild(infoDiv);
        li.appendChild(contenedorPrincipal);
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '❌';
        btnEliminar.onclick = async (e) => { e.stopPropagation(); await deleteDoc(doc(db, "peliculas", pelicula.id)); };
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
                if (idEdicionPelicula) { await updateDoc(doc(db, "peliculas", idEdicionPelicula), datosPeli); } 
                else { await addDoc(collection(db, "peliculas"), datosPeli); }
                cerrarModalPelicula();
            } catch (e) { console.error(e); }
        } else { alert('¡El título no puede estar vacío!'); }
    });
}

// ==========================================
// LÓGICA DE MÚSICA (EDICIÓN Y PORTADA INCLUIDA)
// ==========================================
const listaMusica = document.getElementById('lista-musica');
const modalMusica = document.getElementById('modal-musica');
const inputTituloMusica = document.getElementById('titulo-musica');
const inputArtistaMusica = document.getElementById('artista-musica');
const inputImagenMusica = document.getElementById('imagen-musica'); // Nuevo campo de portada
const inputFechaMusica = document.getElementById('fecha-musica');
const inputNotaMusica = document.getElementById('nota-musica');
let idEdicionMusica = null;

function cerrarModalMusica() { modalMusica.classList.remove('mostrar-modal'); inputTituloMusica.value = ''; inputArtistaMusica.value = ''; inputImagenMusica.value = ''; inputFechaMusica.value = ''; inputNotaMusica.value = '3'; idEdicionMusica = null; document.querySelector('#modal-musica h3').textContent = 'Nuevo Proyecto'; }

function renderizarMusica() {
    if (!listaMusica) return; listaMusica.innerHTML = '';
    musica.forEach((item) => {
        const li = document.createElement('li');
        li.style.padding = '12px 15px';
        li.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') return;
            idEdicionMusica = item.id;
            document.querySelector('#modal-musica h3').textContent = 'Editar Proyecto';
            inputTituloMusica.value = item.titulo; inputArtistaMusica.value = item.artista || ''; inputImagenMusica.value = item.imagen || ''; inputFechaMusica.value = item.fecha || ''; inputNotaMusica.value = item.nota || '3';
            modalMusica.classList.add('mostrar-modal');
        });
        
        const contenedorPrincipal = document.createElement('div');
        contenedorPrincipal.classList.add('item-entretenimiento'); // Usamos la clase compartida
        
        // --- NUEVO: RENDERIZADO DE LA PORTADA DE MÚSICA ---
        const img = document.createElement('img');
        img.classList.add('portada-portada'); // Usamos la clase compartida
        img.src = item.imagen ? item.imagen : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="65" height="95" style="background:%232c323d"></svg>';
        contenedorPrincipal.appendChild(img);
        // -------------------------------------------------

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('info-entretenimiento'); // Clase compartida
        infoDiv.innerHTML = `<span class="titulo-tarea">${item.titulo}</span><span class="estrellas-valoracion">${'⭐'.repeat(parseInt(item.nota))}</span>`;
        const detallesDiv = document.createElement('div');
        detallesDiv.classList.add('detalles-tarea');
        if (item.artista) detallesDiv.innerHTML += `<span class="platforma-musica-badge musica-badge-color">${item.artista}</span>`; // Morado
        if (item.fecha) detallesDiv.innerHTML += `<span>📅 ${new Date(item.fecha).toLocaleDateString('es-ES')}</span>`;
        infoDiv.appendChild(detallesDiv);
        contenedorPrincipal.appendChild(infoDiv);
        li.appendChild(contenedorPrincipal);
        
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '❌';
        btnEliminar.onclick = async (e) => { e.stopPropagation(); await deleteDoc(doc(db, "musica", item.id)); };
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
            // Guardamos el campo 'imagen'
            const datosMusica = { titulo: titulo, artista: artista, imagen: inputImagenMusica.value.trim(), fecha: inputFechaMusica.value, nota: inputNotaMusica.value };
            try {
                if (idEdicionMusica) { await updateDoc(doc(db, "musica", idEdicionMusica), datosMusica); } 
                else { await addDoc(collection(db, "musica"), datosMusica); }
                cerrarModalMusica();
            } catch (e) { console.error(e); }
        } else { alert('¡El título y el artista son obligatorios!'); }
    });
}