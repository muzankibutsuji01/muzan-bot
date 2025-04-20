const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { TOKEN, CLIENT_ID, GUILD_ID, MODO_GLOBAL } = process.env;

if (!TOKEN || !CLIENT_ID) {
    console.error('❌ Faltan TOKEN o CLIENT_ID en el archivo .env');
    process.exit(1);
}

// 📁 Cargar todos los comandos desde /commands
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Recursivamente buscar archivos .js en comandos
function cargarComandos(directorio) {
    const archivos = fs.readdirSync(directorio);

    for (const archivo of archivos) {
        const rutaCompleta = path.join(directorio, archivo);
        const stat = fs.statSync(rutaCompleta);

        if (stat.isDirectory()) {
            cargarComandos(rutaCompleta);
        } else if (archivo.endsWith('.js')) {
            const command = require(rutaCompleta);
            if (command?.data && command?.execute) {
                commands.push(command.data.toJSON());
            } else {
                console.warn(`[⚠️] El archivo "${archivo}" no exporta correctamente "data" o "execute".`);
            }
        }
    }
}

cargarComandos(commandsPath);

// 🛰️ Inicializar REST API
const rest = new REST({ version: '10' }).setToken(TOKEN);

// 🌍 Registrar comandos
(async () => {
    try {
        if (MODO_GLOBAL === 'true') {
            console.log('🌐 Registrando comandos slash en modo GLOBAL...');
            const data = await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commands }
            );
            console.log(`✅ ${data.length} comandos globales registrados correctamente.`);
        } else {
            if (!GUILD_ID) {
                console.error('❌ Falta GUILD_ID en .env para modo servidor de pruebas.');
                return;
            }

            console.log('🧪 Registrando comandos slash en modo SERVIDOR DE PRUEBAS...');
            const data = await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands }
            );
            console.log(`✅ ${data.length} comandos registrados en el servidor.`);
        }

        console.log('📦 Comandos registrados:', commands.map(c => c.name));
    } catch (error) {
        console.error('❌ Error al registrar los comandos:', error);
    }
})();
