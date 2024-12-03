document.addEventListener("DOMContentLoaded", function () {
  const latitudInput = document.getElementById("latitud");
  const longitudInput = document.getElementById("longitud");
  const navUserDiv = document.querySelector("div > span");
  const tipoAlertaSelect = document.getElementById("tipoAlerta");
  const panicButton = document.getElementById("panicButton");
  let apiUrl = "";
  let usuarioId = null;

  function showElement(elementId) {
    document.getElementById(elementId).style.display = "block";
  }

  function hideElement(elementId) {
    document.getElementById(elementId).style.display = "none";
  }

  function disableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = true;
    }
  }

  function updateStatusMessage(message) {
    const statusMessageElement = document.getElementById("statusMessage");
    if (statusMessageElement) {
      statusMessageElement.textContent = message;
    }
  }

  function enableButton(buttonId) {
    const button = document.getElementById(buttonId);
    button.disabled = false;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        latitudInput.value = position.coords.latitude;
        longitudInput.value = position.coords.longitude;
      },
      function () {},
      {
        enableHighAccuracy: true,
      }
    );
  }

  async function obtenerConfig() {
    try {
      const response = await fetch("/config");
      const data = await response.json();
      apiUrl = data.apiUrl;
      await cargarTiposDeAlerta();
      await getRandomUser();
    } catch (error) {
      alert("Error al obtener la configuración del servidor.");
    }
  }

  async function getRandomUser() {
    try {
      const response = await fetch(`${apiUrl}/random-user`);
      if (!response.ok) throw new Error("Error al obtener el usuario aleatorio");
      const data = await response.json();
      if (data.username && data.mail && data.id) {
        navUserDiv.textContent = `Usuario: ${data.username} ${data.mail}`;
        usuarioId = data.id;
      } else {
        navUserDiv.textContent = "Usuario: No disponible";
        usuarioId = null;
      }
    } catch {
      navUserDiv.textContent = "Usuario: No disponible";
      usuarioId = null;
    }
  }

  async function cargarTiposDeAlerta() {
    try {
      const response = await fetch(`${apiUrl}/tipo-alerta`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      data.forEach((tipo, index) => {
        if (tipo.id !== 8) {
          const option = document.createElement("option");
          option.value = index + 1;
          option.textContent = tipo.descripcion;
          document.getElementById("tipoAlerta").appendChild(option);
        }
      });
    } catch {}
  }

  panicButton.addEventListener("click", async () => {
    try {
      if (!usuarioId) return;
      const latitude = latitudInput.value;
      const longitude = longitudInput.value;

      const response = await fetch(`${apiUrl}/trigger-panic-button`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: usuarioId,
          latitud: latitude,
          longitud: longitude,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        hideElement("detailed-alarm");
        showElement("statusMessage_section");
        updateStatusMessage(
          "La ayuda va en camino, estamos monitorizando su alerta"
        );
        disableButton("panicButton");
      }
    } catch {}
  });

  document
    .getElementById("alertForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!usuarioId) return;

      const latitude = latitudInput.value;
      const longitude = longitudInput.value;
      const selectElement = document.getElementById("tipoAlerta");
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      const idTipo = selectedOption.value;
      const mensaje = document.getElementById("mensaje").value;
      const foto = document.getElementById("foto").files[0];
      const formData = new FormData();

      formData.append("id_usuario", usuarioId);
      formData.append("id_tipo", idTipo);
      formData.append("mensaje", mensaje);
      formData.append("latitud", latitude);
      formData.append("longitud", longitude);
      formData.append("foto", foto || null);

      try {
        const response = await fetch(`${apiUrl}/send-alert`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          showElement("statusMessage_section");
          hideElement("pb_back_section");
          disableButton("send_alert_button");
        }
      } catch {}
    });

  document
    .getElementById("detailed-alarm-button")
    .addEventListener("click", function () {
      hideElement("panic-button-section");
      hideElement("detailed-alarm");
      showElement("alarmSection");
      showElement("pb_back_section");
    });

  document
    .getElementById("panic-button_back")
    .addEventListener("click", function () {
      showElement("panic-button-section");
      showElement("detailed-alarm");
      hideElement("alarmSection");
      hideElement("pb_back_section");
    });

  obtenerConfig();
});
