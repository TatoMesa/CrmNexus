const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta 'dist' generada por Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Redirigir todas las peticiones al index.html para soportar Single Page Applications (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor de Nexus CRM iniciado correctamente.`);
  console.log(`Disponible localmente en: http://localhost:${PORT}`);
  console.log(`Puerto: ${PORT}`);
});
