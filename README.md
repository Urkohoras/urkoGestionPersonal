# ⚙️ Gestor Personal Web

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

Plataforma web ligera y modular diseñada para la gestión integral de productividad y consumo multimedia personal. Desarrollada con tecnologías web nativas (Vanilla JavaScript, HTML5, CSS3) para garantizar un rendimiento óptimo sin dependencia de frameworks pesados.

🌍 **Live Demo:** [gestorpersonal.urk0.me](http://gestorpersonal.urk0.me)

## 📌 Arquitectura y Módulos

La aplicación está estructurada en módulos independientes para facilitar la escalabilidad y el mantenimiento del código:

*   **Autenticación (`login.html`):** Interfaz de control de acceso a la plataforma.
*   **Gestor de Tareas (`tareas.html`):** Módulo de productividad para el seguimiento y organización de tareas pendientes.
*   **Biblioteca Musical (`musica.html`):** Seguimiento y catalogación de consumo musical.
*   **Gestor Cinematográfico (`peliculas.html`):** Control y registro de películas y contenido audiovisual.
*   **Dashboard Central (`index.html`):** Panel principal de navegación e integración de módulos.

## 🛠️ Estructura Técnica

El proyecto sigue una arquitectura estática clásica, separando la lógica, la presentación y la estructura:

*   `app.js`: Contiene toda la lógica de negocio, manipulación del DOM y gestión del estado en el cliente.
*   `style.css`: Hojas de estilo centralizadas para una interfaz de usuario coherente y responsiva.
*   `CNAME`: Configuración de enrutamiento DNS para el dominio personalizado.

## 🚀 Despliegue y Ejecución Local

Al ser una aplicación web estática, no requiere configuración de servidor backend ni instalación de dependencias npm.

1. Clona este repositorio:
   ```bash
   git clone [https://github.com/Urkohoras/urkoGestionPersonal](https://github.com/Urkohoras/urkoGestionPersonal)