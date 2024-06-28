const express = require('express');
const helmet = require('helmet');
const path = require('path');

const app = express();
const port = 3001;

// Configuración de Helmet con políticas personalizadas
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", "data:", "https:"], // Permitir imágenes desde el mismo origen y fuentes HTTPS
        // Puedes añadir más directivas según tus necesidades
      },
    },
  })
);

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir la página web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
