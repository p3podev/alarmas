document.addEventListener("DOMContentLoaded", function () {
  const latitudInput = document.getElementById("latitud");
  const longitudInput = document.getElementById("longitud");
  let activeNotificationId = null;

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
        enableHighAccuracy: true, // Habilitar alta precisión
      }
    );
  } else {
    console.log("Tu navegador no soporta geolocalización.");
  }

  // Obtener la URL de la API desde /config
  fetch("/config")
    .then((response) => response.json())
    .then((data) => {
      const apiUrl = data.apiUrl; // Obtener la URL de la API
      console.log("API URL:", apiUrl);

      // Manejar el envío del formulario
      document
        .getElementById("alertForm")
        .addEventListener("submit", function (event) {
          event.preventDefault();

          const formData = new FormData(this);

          fetch(apiUrl + "/alerta", {
            // Usar la apiUrl para las solicitudes
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              activeNotificationId = data.id;
              console.log("ID de la alerta activa:", activeNotificationId);

              const statusMessageElement =
                document.getElementById("statusMessage");
              statusMessageElement.textContent =
                "Espere estamos atendiendo su alerta";

              // Conectar el socket después de recibir la respuesta del servidor
              const socket = io(apiUrl); // Usar la apiUrl para establecer la conexión del socket
              socket.on("connect", () => {
                console.log("Socket conectado:", socket.connected);
                // Escuchar el evento 'alert-resolved' del servidor
                socket.on("alert-resolved", (updatedAlert) => {
                  console.log("Alerta resuelta recibida:", updatedAlert);
                  consultarEstadoAlerta(activeNotificationId);
                });
              });
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("Error al enviar la alerta.");
            });
        });
    })
    .catch((error) => {
      console.error("Error al obtener la configuración:", error);
      alert("Error al obtener la configuración del servidor.");
    });

  // Función para consultar el estado de la alerta y su feedback
  function consultarEstadoAlerta(id) {
    fetch(apiUrl + `/notificaciones/${id}`) // Usar la apiUrl para la consulta
      .then((response) => response.json())
      .then((data) => {
        console.log("Datos recibidos:", data); // Añadir registro de consola para verificar los datos recibidos

        const statusMessageElement = document.getElementById("statusMessage");
        if (data.estado === "activo") {
          statusMessageElement.textContent =
            "Espere estamos atendiendo su alerta";
        } else if (data.estado === "inactivo" && data.feedback) {
          statusMessageElement.textContent = `Su solicitud fue resuelta: ${data.feedback}`;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error al consultar el estado de la alerta.");
      });
  }
});
