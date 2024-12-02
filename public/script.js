document.addEventListener("DOMContentLoaded", function () {
  const latitudInput = document.getElementById("latitud");
  const longitudInput = document.getElementById("longitud");
  const navUserDiv = document.querySelector("div > span"); // Seleccionar el span donde aparecerá el usuario
  const tipoAlertaSelect = document.getElementById("tipoAlerta");
  const panicButton = document.getElementById('panicButton');
  let apiUrl = "";
  let usuarioId = null;

  // Funciones para manipular el DOM
  function showElement(elementId) {
    document.getElementById(elementId).style.display = "block";
  }

  function hideElement(elementId) {
    document.getElementById(elementId).style.display = "none";
  }

  function disableButton(buttonId) {
    const button = document.getElementById(buttonId);
    button.disabled = true;
  }

  function enableButton(buttonId) {
    const button = document.getElementById(buttonId);
    button.disabled = false;
  }

  // Obtener la ubicación al cargar la página
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        latitudInput.value = latitude;
        longitudInput.value = longitude;
        console.log("Ubicación obtenida:", latitude, longitude);
      },
      function (error) {
        console.error("Error al obtener la ubicación:", error);
      },
      {
        enableHighAccuracy: true,
      }
    );
  } else {
    console.log("Tu navegador no soporta geolocalización.");
  }

  // Obtener la URL de la API desde /config
  async function obtenerConfig() {
    try {
      const response = await fetch("/config");
      const data = await response.json();
      apiUrl = data.apiUrl;
      console.log("API URL:", apiUrl);

      // Después de obtener la URL de la API, cargamos los tipos de alerta
      await cargarTiposDeAlerta();

      // Llamar a la función para obtener un usuario aleatorio
      await getRandomUser();
    } catch (error) {
      console.error("Error al obtener la configuración:", error);
      alert("Error al obtener la configuración del servidor.");
    }
  }

  // Función para obtener un usuario aleatorio
  async function getRandomUser() {
    try {
      const response = await fetch(`${apiUrl}/random-user`);
      if (!response.ok) {
        throw new Error("Error al obtener el usuario aleatorio");
      }
      const data = await response.json();
      console.log("Respuesta de la API (usuario aleatorio):", data); // Agregado para depuración
      if (data.username && data.mail && data.id) {  // Asegurarse de que 'id' esté presente
        navUserDiv.textContent = `Usuario: ${data.username} ${data.mail}`; // Mostrar username y mail
        usuarioId = data.id; // Guardar el ID del usuario aleatorio
      } else {
        navUserDiv.textContent = "Usuario: No disponible";
        usuarioId = null;
      }
    } catch (error) {
      console.error(error);
      navUserDiv.textContent = "Usuario: No disponible";
      usuarioId = null;
    }
  }

  // Función para cargar los tipos de alerta
  async function cargarTiposDeAlerta() {
    try {
      const response = await fetch(`${apiUrl}/tipo-alerta`);
      if (!response.ok) {
        throw new Error("Error al cargar los tipos de alerta");
      }
      const data = await response.json();
      data.forEach(tipo => {
        if (tipo.id !== 8) { // Excluimos el tipo con id = 8
          const option = document.createElement("option");
          option.value = tipo.id; // El valor es el ID
          option.textContent = tipo.descripcion; // El texto es la descripción
          tipoAlertaSelect.appendChild(option);
        }
      });
    } catch (error) {
      console.error("Error al cargar los tipos de alerta:", error);
    }
  }

  // Evento para el botón "panicButton"
  panicButton.addEventListener('click', async () => {
    try {
      if (!usuarioId) {
        console.error("Error: Usuario no disponible.");
        return;
      }

      const latitude = latitudInput.value;
      const longitude = longitudInput.value;

      // Enviar datos al backend para crear la alerta
      const response = await fetch(`${apiUrl}/create-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_usuario: usuarioId,
          id_tipo: 8, // Tipo de alerta predefinido
          mensaje: null, // No mensaje
          latitud: latitude,
          longitud: longitude,
          foto_url: null, // No foto
          id_georeferencia: null, // No georeferencia
          id_sirena: null, // No sirena
          estado: 'activo', // Estado activo
          feedback: null, // No feedback
        }),
      });
      
      const data = await response.json();
      console.log('Alerta creada:', data);
      // Cambiar vista después de enviar la alerta
      hideElement("detailed-alarm");
      showElement("statusMessage_section");
      disableButton("panicButton");
    } catch (error) {
      console.error('Error al crear alerta:', error);
    }
  });

  // Evento para el botón "detailed-alarm-button"
  document
    .getElementById("detailed-alarm-button")
    .addEventListener("click", function () {
      hideElement("panic-button-section");
      hideElement("detailed-alarm");
      showElement("alarmSection");
      showElement("pb_back_section");
    });

  // Evento para el botón "panic-button_back"
  document
    .getElementById("panic-button_back")
    .addEventListener("click", function () {
      showElement("panic-button-section");
      showElement("detailed-alarm");
      hideElement("alarmSection");
      hideElement("pb_back_section");
    });

  // Evento para el botón "send_alert_button"
  document
    .getElementById("send_alert_button")
    .addEventListener("click", function () {
      showElement("statusMessage_section");
      hideElement("pb_back_section");
      disableButton("send_alert_button");
    });

  // Llamar a obtener configuración e inicializar
  obtenerConfig();
});

